
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

        let browserInstance = await this.browser.instance();
        let page = await browserInstance.getPage();

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
            // TODO need to restart browser
        }

        this.activeTarget = null;
    }

    async close() {
        await this.browser.close();
    }

}

module.exports = Worker;
