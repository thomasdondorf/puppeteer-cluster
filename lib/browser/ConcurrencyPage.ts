
import AbstractBrowser, { WorkerBrowserInstance } from './AbstractBrowser';

// TODO get these two working together
const puppeteer = require('puppeteer');
import { Page, Browser } from 'puppeteer';

export default class ConcurrencyPage extends AbstractBrowser {

    private chrome: Browser | null = null;

    private repairRequested: boolean = false;
    private repairing: boolean = false;
    private openInstances: number = 0;
    private waitingForRepairResolvers: (() => void)[] = [];

    async init() {
        this.chrome = await puppeteer.launch(this.options);
    }

    async close() {
        await (<Browser>this.chrome).close();
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
            await (<Browser>this.chrome).close();
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
        let page: Page;

        return {
            instance: async () => {
                if (this.repairRequested) {
                    await new Promise(resolve => {
                        this.waitingForRepairResolvers.push(resolve);
                    });
                }

                this.openInstances++;
                page = await (<Browser>this.chrome).newPage();

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

}
