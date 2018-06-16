
const Cluster = require('./Cluster');
const Browser = require('./Browser');

const DEFAULT_OPTIONS = {
    args: [],
};

class Worker {

    static async launch(options) {
        const worker = new Worker(options);
        await worker.init();

        return worker;
    }

    constructor({ cluster, args, concurrency, browser = null }) {
        this.cluster = cluster;
        this.args = args;
        this.concurrency = concurrency;

        // might be set when there is one browser for all workers (depending on concurrency option)
        this.browser = browser;
    }

    async init() {
        if (this.concurrency === Cluster.CONCURRENCY_BROWSER) {
            // start browser on our own
            this.browser = await Browser.launch({
                args: this.options.args,
            });
        }
    }

    async handle(task, target) {
        console.log('  handle: ' + target.url);
        const page = await this.browser.getPage();
        await task({
            url: target.url,
            page,
            cluster: this.cluster,
            context: {},
        });
        await page.close();
    }

}

module.exports = Worker;
