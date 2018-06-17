
const Worker = require('./Worker');
const Target = require('./Target');
const Display = require('./Display');
const constants = require('./constants');
const util = require('./util');

const ConcurrencyPage = require('./browser/ConcurrencyPage');
const ConcurrencyBrowser = require('./browser/ConcurrencyBrowser');
const ConcurrencyContext = require('./browser/ConcurrencyContext');

const DEFAULT_OPTIONS = {
    minWorker: 0,
    maxWorker: 4,
    maxCPU: 1,
    maxMemory: 1,
    concurrency: constants.CLUSTER_CONCURRENCY_PAGE,
    args: [],
    monitor: false,
};

class Cluster {

    static async launch(options) {
        const cluster = new Cluster(options);
        await cluster.init();

        return cluster;
    }

    constructor(options) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        this._workers = [];
        this._workersAvail = [];
        this._workersBusy = [];
        this._workersStarting = 0;

        this._allTargetCount = 0;
        this._queue = [];
        this._task = null;

        this._idleResolvers = [];

        this.browser = null;
        this._isClosed = false;

        this._startTime = Date.now();

        this._nextWorkerId = -1;

        this.monitoringInterval = null;
        if (this.options.monitor) {
            this.monitoringInterval = setInterval(
                () => this.monitor(),
                constants.CLUSTER_MONITORING_INTERVAL
            );
        }
    }

    async init() {
        let Concurrency;
        if (this.options.concurrency === constants.CLUSTER_CONCURRENCY_PAGE) {
            Concurrency = ConcurrencyPage;
        } else if (this.options.concurrency === constants.CLUSTER_CONCURRENCY_BROWSER) {
            Concurrency = ConcurrencyBrowser;
        } else if (this.options.concurrency === constants.CLUSTER_CONCURRENCY_CONTEXT) {
            Concurrency = ConcurrencyContext;
        } else {
            throw new Error('Unknown concurrency option: ' + this.options.concurrency);
        }

        try {
            this.browser = await Concurrency.launch({
                headless: false, // TODO just for testing
                args: this.options.args.concat([/*'--no-sandbox',*/ '--disable-dev-shm-usage']),
            });
        } catch (err) {
            throw new Error(`Unable to launch browser, error message: ${err.message}`);
        }

        // launch minimal number of workers
        for (let i = 0; i < this.options.minWorker; i++) {
            await this._launchWorker();
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
            args: this.options.args,
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

    async setTask(taskHandler, name) {
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
                const worker = this._workersAvail.shift();
                this._workersBusy.push(worker);

                const target = this._queue.shift();
                await worker.handle(this._task, target);

                // add worker to available workers again
                const workerIndex = this._workersBusy.indexOf(worker);
                this._workersBusy.splice(workerIndex, 1);

                this._workersAvail.push(worker);

                this._work();
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
        return (workerCount < this.options.maxWorker);
    }

    async queue(url, context) {
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
                workerUrl = worker.activeTarget.url;
            }

            display.log(`   #${i} ${workOrIdle} ${workerUrl}`);
        });
        for (let i = 0; i < this._workersStarting; i++) {
            display.log(`   #${this._workers.length + i} STARTING...`)
        }

        display.resetCursor();
    }

}

Cluster.CONCURRENCY_PAGE = constants.CLUSTER_CONCURRENCY_PAGE;
Cluster.CONCURRENCY_CONTEXT = constants.CLUSTER_CONCURRENCY_CONTEXT;
Cluster.CONCURRENCY_BROWSER = constants.CLUSTER_CONCURRENCY_BROWSER;

module.exports = Cluster;
