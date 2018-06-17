
const puppeteer = require('puppeteer');

class ConcurrencyBrowser {

    static async launch(options) {
        return new ConcurrencyBrowser(options);
    }

    constructor(options) {
        this.options = options;
    }

    async workerInstance() {
        let chrome = await puppeteer.launch(this.options);
        let page, context;

        return {
            instance: async () => {
                context = await chrome.createIncognitoBrowserContext();
                page = await context.newPage();

                return {
                    page,

                    close: async () => {
                        await page.close();
                        await context.close();
                    }
                }
            },

            close: async () => {
                await chrome.close();
            },

            repair: async () => {
                console.log('Starting repair');
                try {
                    // will probably fail, but just in case the repair was not necessary
                    await chrome.close();
                } catch (e) {}

                // just relaunch as there is only one page per browser, we can be sure that there is only one page open
                chrome = await puppeteer.launch(this.options);
            },
        }
    }

    async close() {
    }
}

module.exports = ConcurrencyBrowser;