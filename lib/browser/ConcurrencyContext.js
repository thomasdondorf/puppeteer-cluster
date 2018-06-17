
const puppeteer = require('puppeteer');

class ConcurrencyContext {

    static async launch(options) {
        const browser = new ConcurrencyContext(options);
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
        let page, context;

        return {
            instance: async () => {
                if (this.repairRequested) {
                    await new Promise(resolve => {
                        this.waitingForRepairResolvers.push(resolve);
                    });
                }

                this.openInstances++;
                context = await this.chrome.createIncognitoBrowserContext();
                page = await context.newPage();

                return {
                    page,

                    close: async () => {
                        this.openInstances--;
                        await page.close();
                        await context.close();

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

module.exports = ConcurrencyContext;