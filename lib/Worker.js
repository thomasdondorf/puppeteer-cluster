
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

    constructor({ cluster, args, id, browser = null }) {
        this.cluster = cluster;
        this.args = args;
        this.activeTarget = null;
        this.id = id;

        this.browser = browser;
    }

    async init() {
    }

    async handle(task, target) {
        this.activeTarget = target;

        let browserInstance, page;

        try {
            browserInstance = await this.browser.instance();
            page = browserInstance.page;
        } catch (err) {
            console.log('Error getting browser page: ' + err.message);
            await this.browser.repair();
            // TODO retry? await this.handle(task, target);
            return;
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
        } catch (err) {
            console.log('Error crawling ' + target.url + ' // ' + err.code + ': ' + err.message);
            target.setError(err);
        }

        try {
            await browserInstance.close();
        } catch (e) {
            console.log('Error closing browser instance ' + target.url + ': ' + e.message);
            await this.browser.repair();
        }

        this.activeTarget = null;
    }

    async close() {
        try {
            await this.browser.close();
        } catch (err) {
            console.log('Unable to close worker browser, most likely already closed. Error message: ' + err.message);
        }
    }

}

module.exports = Worker;
