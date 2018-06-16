
const puppeteer = require('puppeteer');

class Browser {

    static async launch(options) {
        const browser = new Browser(options);
        await browser.init();

        return browser;
    }

    constructor({ args = [] }) {
        this.args = args;
    }

    async init() {
        try {
            this.chrome = await puppeteer.launch({
                headless: false, // TODO just for testing
                args: this.args.concat([/*'--no-sandbox',*/ '--disable-dev-shm-usage']),
            });
        } catch (error) {
            // start another try?
            console.error(`Problem starting a worker, message: ${error}`);
        }
    }

    async getPage() {
        return await this.chrome.newPage();
    }

    async close() {
        return await this.chrome.close();
    }

}

module.exports = Browser;
