
const puppeteer = require('puppeteer');

class ConcurrencyPage {

    static async launch(options) {
        const browser = new ConcurrencyPage(options);
        await browser.init();

        return browser;
    }

    constructor(options) {
        this.options = options;

        this.repairing = false;
    }

    async init() {
        this.chrome = await puppeteer.launch(this.options);
    }

    async workerInstance() {
        let page;

        return {
            instance: async () => {
                page = await this.chrome.newPage();

                return {
                    page,

                    close: async () => {
                        await page.close();
                    }
                };
            },

            close: async () => {

            },

            repair: async () => {
                if (this.repairing) {
                    // someone already triggered a repair
                    return;
                }
                this.repairing = true;


            }
        };
    }

    async close() {
        await this.chrome.close();
    }
}

module.exports = ConcurrencyPage;