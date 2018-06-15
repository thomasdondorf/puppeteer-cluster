
const Worker = require('./Worker');
const Task = require('./Task');

const DEFAULT_OPTIONS = {
    minWorker: 0,
    maxWorker: 4,
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

        this.workers = [];
        this.taskHandler = null;
    }

    async init() {
        // launch minimal number of workers
        for (let i = 0; i < this.options.minWorker; i++) {
            try {
                const worker = await Worker.launch();
                this.workers.push(worker);
            } catch (error) {
                console.error(`Problem starting a worker, message: ${error}`);
            }
        }
    }

    async task(handler, name) {
        this.taskHandler = new Task(handler);
        // handle different names for tasks
    }

    async queue(url) {
        let urls = [];
        if (Array.isArray(url)) {
            urls = url;
        } else { // just one url
            urls.push(url);
        }
    }

}

module.exports = Cluster;
