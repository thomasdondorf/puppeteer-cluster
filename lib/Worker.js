
const Browser = require('./Browser');
const constants = require('./constants');
const Target = require('./Target');

const DEFAULT_OPTIONS = {
    args: [],
};

class Worker {

    static async launch(options) {
        const worker = new Worker(options);
        await worker.init();

        return worker;
    }

    constructor({ cluster, args, concurrency, id, browser = null }) {
        this.cluster = cluster;
        this.args = args;
        this.concurrency = concurrency;
        this.activeTarget = null;
        this.id = id;

        // might be set when there is one browser for all workers (depending on concurrency option)
        this._browser = browser;
    }

    async init() {
        if (this.concurrency === constants.CLUSTER_CONCURRENCY_BROWSER) {
            // start browser on our own
            this._browser = await Browser.launch({
                args: this.args,
            });
        }
    }

    async handle(task, target) {
        this.activeTarget = target;

        let page;
        let context;
        if (this.concurrency === constants.CLUSTER_CONCURRENCY_PAGE) {
            page = await this._browser.getPage();
        } else if (this.concurrency === constants.CLUSTER_CONCURRENCY_CONTEXT
            || this.concurrency === constants.CLUSTER_CONCURRENCY_BROWSER) {
            context = await this._browser.getContext();
            page = await context.newPage();
        }

        try {
            await task({
                url: target.url,
                page,
                cluster: this.cluster,
                worker: {
                    id: this.id,
                },
                context: {},
            });
        } catch (e) {
            console.log('Error crawling ' + target.url + ': ' + e.message);
        }
        await page.close();

        if (context) {
            await context.close();
        }
        this.activeTarget = null;
    }

    async close() {
        if (this.concurrency === constants.CLUSTER_CONCURRENCY_BROWSER) {
            this._browser.close();
        }
    }

}

module.exports = Worker;
