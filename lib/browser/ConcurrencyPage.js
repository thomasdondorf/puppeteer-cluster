
const puppeteer = require('puppeteer');

class ConcurrencyPage {

    static async launch(options) {
        const browser = new ConcurrencyPage(options);
        await browser.init();

        return browser;
    }

    constructor(options) {
        this.options = options;
    }

    async init() {
        this.chrome = await puppeteer.launch(this.options);
    }

    async workerInstance() {
        let page;

        return {
            instance: async () => {
                return {
                    getPage: async() => { // TODO try catch
                        page = await this.chrome.newPage();
                        return page;
                    },
                    close: async () => { // TODO try catch
                        await page.close();
                    }
                };
            },

            close: async () => {

            },
        };
    }

    async close() {
        await this.chrome.close();
    }
}

module.exports = ConcurrencyPage;