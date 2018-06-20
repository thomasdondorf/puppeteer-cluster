
import AbstractBrowser, { WorkerBrowserInstance } from './AbstractBrowser';

import * as puppeteer from 'puppeteer';

export default class ConcurrencyPage extends AbstractBrowser {

    private chrome: puppeteer.Browser | null = null;

    private repairRequested: boolean = false;
    private repairing: boolean = false;
    private openInstances: number = 0;
    private waitingForRepairResolvers: (() => void)[] = [];

    public async init() {
        this.chrome = await puppeteer.launch(this.options);
    }

    public async close() {
        await (<puppeteer.Browser>this.chrome).close();
    }

    private async startRepair() {
        if (this.repairing || this.openInstances !== 0) {
            // already repairing or there are still pages open? -> cancel
            return;
        }

        this.repairing = true;
        console.log('Starting repair');

        try {
            // will probably fail, but just in case the repair was not necessary
            await (<puppeteer.Browser>this.chrome).close();
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

    public async workerInstance() {
        let page: puppeteer.Page;
        let context: any; // puppeteer typings are strange..

        return {
            instance: async () => {
                if (this.repairRequested) {
                    await new Promise(resolve => this.waitingForRepairResolvers.push(resolve));
                }

                this.openInstances += 1;
                // @ts-ignore Typings are not up-to-date, ignore for now...
                context = await this.chrome.createIncognitoBrowserContext();
                page = await context.newPage();

                return {
                    page,

                    close: async () => {
                        this.openInstances -= 1; // decrement first in case of error
                        await page.close();
                        await context.close();

                        if (this.repairRequested) {
                            await this.startRepair();
                        }
                    },
                };
            },

            close: async () => {

            },

            repair: async () => {
                this.repairRequested = true;
                await this.startRepair();
            },
        };
    }

}
