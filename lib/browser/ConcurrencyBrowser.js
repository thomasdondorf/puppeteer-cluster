
const puppeteer = require('puppeteer');

class ConcurrencyBrowser {

    static async launch(options) {
        return new ConcurrencyBrowser(options);
    }

    constructor(options) {
        this.options = options;
    }

    async workerInstance() {
        const chrome = await puppeteer.launch(this.options);
        let page, context;

        return {
            instance: async () => {
                return {
                    getPage: async() => { // TODO try catch
                        context = await chrome.createIncognitoBrowserContext();
                        page = await context.newPage();
                        return page;
                    },
                    close: async () => { // TODO try catch
                        await page.close();
                        await context.close();
                    }
                }
            },

            close: async () => {
                await chrome.close();
            },
        }
    }

    async close() {
    }
}

module.exports = ConcurrencyBrowser;