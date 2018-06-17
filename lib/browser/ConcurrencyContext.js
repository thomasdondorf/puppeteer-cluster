
const puppeteer = require('puppeteer');

class ConcurrencyContext {

    static async launch(options) {
        const browser = new ConcurrencyContext(options);
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
        let page, context;

        return {
            instance: async () => {
                return {
                    getPage: async() => { // TODO try catch
                        context = await this.chrome.createIncognitoBrowserContext();
                        page = await context.newPage();
                        return page;
                    },
                    close: async () => { // TODO try catch
                        await page.close();
                        await context.close();
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

module.exports = ConcurrencyContext;