
import Target from './Target';
import Display from './Display';
import * as util from './util';
import Worker, { TaskArguments } from './Worker';

import ConcurrencyBrowser from './browser/ConcurrencyBrowser';
import ConcurrencyPage from './browser/ConcurrencyPage';
import ConcurrencyContext from './browser/ConcurrencyContext';

import { LaunchOptions } from 'puppeteer';

interface ClusterOptions {
    maxConcurrency: number,
    maxCPU: number,
    maxMemory: number,
    concurrency: number,
    puppeteerOptions: LaunchOptions,
    monitor: boolean,
};

const DEFAULT_OPTIONS: ClusterOptions = {
    maxConcurrency: 4,
    maxCPU: 1,
    maxMemory: 1,
    concurrency: 2, // PAGE
    puppeteerOptions: {
        headless: false // just for testing...
    },
    monitor: false,
};

type TaskFunction = (args: TaskArguments) => Promise<void>;

const MONITORING_INTERVAL = 500;

export default class Cluster {

    static CONCURRENCY_PAGE = 1; // shares cookies, etc.
    static CONCURRENCY_CONTEXT = 2; // no cookie sharing (uses contexts)
    static CONCURRENCY_BROWSER = 3; // no cookie sharing and individual processes (also uses contexts)

    private options: ClusterOptions;
    private _workers: Worker[] = [];
    private _workersAvail: Worker[] = [];
    private _workersBusy: Worker[] = [];
    private _workersStarting = 0;

    private _allTargetCount = 0;
    private _queue: Target[] = [];

    private _task: TaskFunction | null = null;
    private _idleResolvers: (() => void)[] = []; // TODO
    private browser: any = null; // TODO

    private _isClosed = false;
    private _startTime = Date.now();
    private _nextWorkerId = -1;

    private monitoringInterval: NodeJS.Timer | null = null;
    private _display: Display | null = null;

    static async launch(options: ClusterOptions) { // TODO launch options
        const cluster = new Cluster(options);
        await cluster.init();

        return cluster;
    };

    constructor(options: ClusterOptions) { // TODO types
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        if (this.options.monitor) {
            this.monitoringInterval = setInterval(
                () => this.monitor(),
                MONITORING_INTERVAL
            );
        }
    }

    async init() {
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

    async _launchWorker() {
        // signal, that we are starting a worker
        this._workersStarting++;
        this._nextWorkerId++;

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
            id: this._nextWorkerId,
        });
        this._workersStarting--;
        if (this._isClosed) {
            // cluster was closed while we created a new worker (should rarely happen)
            worker.close();
        } else {
            this._workersAvail.push(worker);
            this._workers.push(worker);
        }
    }

    async setTask(taskHandler: ((args: TaskArguments) => Promise<void>)) {
        this._task = taskHandler;
        // TODO handle different names for tasks
    }

    async _work() {
        // find empty instance

        if (this._queue.length === 0) {
            if (this._workersBusy.length === 0) {
                this._idleResolvers.forEach(resolve => resolve());
            }
        } else {
            if (this._workersAvail.length !== 0) {
                // worker is available, lets go
                const worker = <Worker>this._workersAvail.shift();
                this._workersBusy.push(worker);

                const target = <Target>this._queue.shift();
                if (this._task !== null) {
                    await worker.handle(this._task, target);
                } else {
                    throw new Error('No task defined!');
                }

                // add worker to available workers again
                const workerIndex = this._workersBusy.indexOf(worker);
                this._workersBusy.splice(workerIndex, 1);

                this._workersAvail.push(worker);

                setImmediate(() => this._work());
            } else if(this._allowedToStartWorker()) {
                await this._launchWorker();
                await this._work(); // call again to process queue
            } else {
                // currently no workers available!
            }
        }
    }

    _allowedToStartWorker() {
        const workerCount = this._workersBusy.length + this._workersAvail.length
            + this._workersStarting;
        return (workerCount < this.options.maxConcurrency);
    }

    async queue(url: string, context: object) {
        this._allTargetCount++;
        this._queue.push(new Target(url, context));
        this._work();
    }

    idle() {
        return new Promise(resolve => {
            this._idleResolvers.push(resolve);
        })
    }

    async close() {
        this._isClosed = true;

        // close workers
        await Promise.all(this._workers.map(worker => worker.close()));

        try {
            await this.browser.close();
        } catch (err) {
            console.log('Unable to close browser, most likely already closed. Error message: ' + err.message);
        }

        if (this.monitoringInterval) {
            this.monitor();
            clearInterval(this.monitoringInterval);
        }

        if (this._display) {
            this._display.close();
        }
    }

    monitor() {
        if (!this._display) {
            this._display = new Display();
        }
        const display = this._display;

        const now = Date.now();
        const timeDiff = now - this._startTime;

        const doneTargets = this._allTargetCount - this._queue.length - this._workersBusy.length;
        const donePercentage = (doneTargets / this._allTargetCount);

        const timeRunning = util.formatDuration(timeDiff);

        let timeRemainingMillis = -1;
        if (donePercentage !== 0) {
            timeRemainingMillis = ((timeDiff) / donePercentage) - timeDiff;
        }
        const timeRemining = util.formatDuration(timeRemainingMillis);

        display.log(`== Start:     ${util.formatDateTime(this._startTime)}`);
        display.log(`== Now:       ${util.formatDateTime(now)} (running for ${timeRunning})`);
        display.log(`== Progress:  ${doneTargets} / ${this._allTargetCount} (${(100 * donePercentage).toFixed(2)}%)`);
        display.log(`== Remaining: ${timeRemining} (rough estimation)`);
        display.log(`== Workers:   ${this._workers.length + this._workersStarting}`);

        this._workers.forEach((worker, i) => {
            const isIdle = this._workersAvail.indexOf(worker) !== -1;
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
        for (let i = 0; i < this._workersStarting; i++) {
            display.log(`   #${this._workers.length + i} STARTING...`)
        }

        display.resetCursor();
    }

}
