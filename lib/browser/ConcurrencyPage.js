
const puppeteer = require('puppeteer');

class ConcurrencyPage {

    static async launch(options) {
        const browser = new ConcurrencyPage(options);
        await browser.init();

        return browser;
    }

    constructor(options) {
        this.options = options;

        this.repairRequested = false;
        this.repairing = false;
        this.waitingForRepairResolvers = [];
        this.openInstances = 0;
    }

    async init() {
        this.chrome = await puppeteer.launch(this.options);
    }

    async _startRepair() {
        if (this.repairing || this.openInstances !== 0) {
            // already repairing or there are still pages open? -> cancel
            return;
        }

        this.repairing = true;
        console.log('Starting repair');

        try {
            // will probably fail, but just in case the repair was not necessary
            await this.chrome.close();
        } catch (e) {}

        try {
            this.chrome = await puppeteer.launch(this.options);
        } catch (err) {
            throw new Error('Unable to restart chrome.');
        }
        this.repairing = false;
        this.repairRequested = false;
        this.waitingForRepairResolvers.forEach(resolve => resolve());
        this.waitingForRepairResolvers = [];
    }

    async workerInstance() {
        let page;

        return {
            instance: async () => {
                if (this.repairRequested) {
                    await new Promise(resolve => {
                        this.waitingForRepairResolvers.push(resolve);
                    });
                }

                this.openInstances++;
                page = await this.chrome.newPage();

                return {
                    page,

                    close: async () => {
                        this.openInstances--; // decrement first in case of error
                        await page.close();

                        if (this.repairRequested) {
                            await this._startRepair();
                        }
                    }
                };
            },

            close: async () => {

            },

            repair: async () => {
                this.repairRequested = true;
                await this._startRepair();
            },
        };
    }

    async close() {
        await this.chrome.close();
    }
}

module.exports = ConcurrencyPage;