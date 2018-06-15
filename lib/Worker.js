
const puppeteer = require('puppeteer');

const DEFAULT_OPTIONS = {
    args: [],
};

class Worker {

    static async launch(options) {
        const worker = new Worker(options);
        await worker.init();

        return worker;
    }

    constructor(options = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    async init() {
        this.chrome = await puppeteer.launch({
            args: this.options.args.concat([/*'--no-sandbox',*/ '--disable-dev-shm-usage']),
        });
    }

}

module.exports = Worker;
