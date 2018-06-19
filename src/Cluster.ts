
import Target from './Target';
import Display from './Display';
import * as util from './util';
import Worker, { TaskArguments } from './Worker';

import ConcurrencyBrowser from './browser/ConcurrencyBrowser';
import ConcurrencyPage from './browser/ConcurrencyPage';
import ConcurrencyContext from './browser/ConcurrencyContext';

import { LaunchOptions } from 'puppeteer';

interface ClusterOptions {
    maxConcurrency: number;
    maxCPU: number;
    maxMemory: number;
    concurrency: number;
    puppeteerOptions: LaunchOptions;
    monitor: boolean;
    timeout: number;
}

const DEFAULT_OPTIONS: ClusterOptions = {
    maxConcurrency: 4,
    maxCPU: 1,
    maxMemory: 1,
    concurrency: 2, // PAGE
    puppeteerOptions: {
        headless: false, // just for testing...
    },
    monitor: false,
    timeout: 30 * 1000,
};

type TaskFunction = (args: TaskArguments) => Promise<void>;

const MONITORING_INTERVAL = 500;

export default class Cluster {

    static CONCURRENCY_PAGE = 1; // shares cookies, etc.
    static CONCURRENCY_CONTEXT = 2; // no cookie sharing (uses contexts)
    static CONCURRENCY_BROWSER = 3; // no cookie sharing and individual processes (uses contexts)

    private options: ClusterOptions;
    private workers: Worker[] = [];
    private workersAvail: Worker[] = [];
    private workersBusy: Worker[] = [];
    private workersStarting = 0;

    private allTargetCount = 0;
    private targetQueue: Target[] = [];

    private task: TaskFunction | null = null;
    private idleResolvers: (() => void)[] = []; // TODO
    private browser: any = null; // TODO

    private isClosed = false;
    private startTime = Date.now();
    private nextWorkerId = -1;

    private monitoringInterval: NodeJS.Timer | null = null;
    private display: Display | null = null;

    public static async launch(options: ClusterOptions) { // TODO launch options
        const cluster = new Cluster(options);
        await cluster.init();

        return cluster;
    }

    private constructor(options: ClusterOptions) { // TODO types
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        if (this.options.monitor) {
            this.monitoringInterval = setInterval(
                () => this.monitor(),
                MONITORING_INTERVAL,
            );
        }
    }

    private async init() {
        const browserOptions = this.options.puppeteerOptions;

        if (this.options.concurrency === Cluster.CONCURRENCY_PAGE) {
            this.browser = new ConcurrencyPage(browserOptions);
        } else if (this.options.concurrency === Cluster.CONCURRENCY_BROWSER) {
            this.browser = new ConcurrencyBrowser(browserOptions);
        } else if (this.options.concurrency === Cluster.CONCURRENCY_CONTEXT) {
            this.browser = new ConcurrencyContext(browserOptions);
        } else {
            throw new Error('Unknown concurrency option: ' + this.options.concurrency);
        }

        try {
            await this.browser.init();
        } catch (err) {
            throw new Error(`Unable to launch browser, error message: ${err.message}`);
        }
    }

    private async launchWorker() {
        // signal, that we are starting a worker
        this.workersStarting += 1;
        this.nextWorkerId += 1;

        let workerBrowserInstance;
        try {
            workerBrowserInstance = await this.browser.workerInstance();
        } catch (err) {
            throw new Error(`Unable to launch browser for worker, error message: ${err.message}`);
        }

        const worker = await Worker.launch({
            cluster: this,
            args: [''], // this.options.args,
            browser: workerBrowserInstance,
            id: this.nextWorkerId,
        });
        this.workersStarting -= 1;

        if (this.isClosed) {
            // cluster was closed while we created a new worker (should rarely happen)
            worker.close();
        } else {
            this.workersAvail.push(worker);
            this.workers.push(worker);
        }
    }

    public async setTask(taskHandler: ((args: TaskArguments) => Promise<void>)) {
        this.task = taskHandler;
        // TODO handle different names for tasks
    }

    private async work() {
        // find empty instance

        if (this.targetQueue.length === 0) {
            if (this.workersBusy.length === 0) {
                this.idleResolvers.forEach(resolve => resolve());
            }
        } else {
            if (this.workersAvail.length !== 0) {
                // worker is available, lets go
                const worker = <Worker>this.workersAvail.shift();
                this.workersBusy.push(worker);

                const target = <Target>this.targetQueue.shift();
                if (this.task !== null) {
                    await worker.handle(this.task, target, this.options.timeout);
                } else {
                    throw new Error('No task defined!');
                }

                // add worker to available workers again
                const workerIndex = this.workersBusy.indexOf(worker);
                this.workersBusy.splice(workerIndex, 1);

                this.workersAvail.push(worker);

                setImmediate(() => this.work());
            } else if (this.allowedToStartWorker()) {
                await this.launchWorker();
                await this.work(); // call again to process queue
            } else {
                // currently no workers available!
            }
        }
    }

    private allowedToStartWorker() {
        const workerCount = this.workersBusy.length + this.workersAvail.length
            + this.workersStarting;
        return (workerCount < this.options.maxConcurrency);
    }

    public async queue(url: string, context: object) {
        this.allTargetCount += 1;
        this.targetQueue.push(new Target(url, context));
        this.work();
    }

    public idle(): Promise<void> {
        return new Promise(resolve => this.idleResolvers.push(resolve));
    }

    public async close(): Promise<void> {
        this.isClosed = true;

        // close workers
        await Promise.all(this.workers.map(worker => worker.close()));

        try {
            await this.browser.close();
        } catch (err) {
            console.log(`Unable to close browser. Error message: ${err.message}`);
        }

        if (this.monitoringInterval) {
            this.monitor();
            clearInterval(this.monitoringInterval);
        }

        if (this.display) {
            this.display.close();
        }
    }

    private monitor(): void {
        if (!this.display) {
            this.display = new Display();
        }
        const display = this.display;

        const now = Date.now();
        const timeDiff = now - this.startTime;

        const doneTargets = this.allTargetCount - this.targetQueue.length - this.workersBusy.length;
        const donePercentage = (doneTargets / this.allTargetCount);
        const donePercStr = (100 * donePercentage).toFixed(2);

        const timeRunning = util.formatDuration(timeDiff);

        let timeRemainingMillis = -1;
        if (donePercentage !== 0) {
            timeRemainingMillis = ((timeDiff) / donePercentage) - timeDiff;
        }
        const timeRemining = util.formatDuration(timeRemainingMillis);

        display.log(`== Start:     ${util.formatDateTime(this.startTime)}`);
        display.log(`== Now:       ${util.formatDateTime(now)} (running for ${timeRunning})`);
        display.log(`== Progress:  ${doneTargets} / ${this.allTargetCount} (${donePercStr}%)`);
        display.log(`== Remaining: ${timeRemining} (rough estimation)`);
        display.log(`== Workers:   ${this.workers.length + this.workersStarting}`);

        this.workers.forEach((worker, i) => {
            const isIdle = this.workersAvail.indexOf(worker) !== -1;
            let workOrIdle;
            let workerUrl = '';
            if (isIdle) {
                workOrIdle = 'IDLE';
            } else {
                workOrIdle = 'WORK';
                workerUrl = worker.activeTarget ? worker.activeTarget.url : 'UNKNOWN TARGET';
            }

            display.log(`   #${i} ${workOrIdle} ${workerUrl}`);
        });
        for (let i = 0; i < this.workersStarting; i += 1) {
            display.log(`   #${this.workers.length + i} STARTING...`);
        }

        display.resetCursor();
    }

}
