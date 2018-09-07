
import AbstractBrowser from './AbstractBrowser';
import * as puppeteer from 'puppeteer';

import { debugGenerator, timeoutExecute } from '../util';
const debug = debugGenerator('BrowserContext');

const BROWSER_TIMEOUT = 5000;

export default class ConcurrencyPage extends AbstractBrowser {

    private chrome: puppeteer.Browser | null = null;

    private repairing: boolean = false;
    private repairRequested: boolean = false;
    private openInstances: number = 0;
    private waitingForRepairResolvers: (() => void)[] = [];

    public async init() {
        this.chrome = await puppeteer.launch(this.options);
    }

    public async close() {
        // TODO investigate this: WINDOWS-specifig problem: On Windows this call sometimes
        // logs "The process with pid could not be terminated" but does not throw an error
        // Has not been a problem so far, expect that Windows logs something in the console
        await (<puppeteer.Browser>this.chrome).close();
    }

    private async startRepair() {
        if (this.openInstances !== 0 || this.repairing) {
            // already repairing or there are still pages open? -> cancel
            await new Promise(resolve => this.waitingForRepairResolvers.push(resolve));
            return;
        }

        this.repairing = true;
        debug('Starting repair');

        try {
            // will probably fail, but just in case the repair was not necessary
            await (<puppeteer.Browser>this.chrome).close();
        } catch (e) {
            debug('Unable to close browser.');
        }

        try {
            this.chrome = await puppeteer.launch(this.options);
        } catch (err) {
            throw new Error('Unable to restart chrome.');
        }
        this.repairRequested = false;
        this.repairing = false;
        this.waitingForRepairResolvers.forEach(resolve => resolve());
        this.waitingForRepairResolvers = [];
    }

    public async workerInstance() {
        let page: puppeteer.Page;
        let context: any; // puppeteer typings are strange..

        return {
            instance: async () => {
                if (this.repairRequested) {
                    await this.startRepair();
                }

                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    context = await (this.chrome as puppeteer.Browser)
                        .createIncognitoBrowserContext();
                    page = await context.newPage();
                })());
                this.openInstances += 1;

                return {
                    page,

                    close: async () => {
                        this.openInstances -= 1; // decrement first in case of error
                        await timeoutExecute(BROWSER_TIMEOUT, context.close());

                        if (this.repairRequested) {
                            await this.startRepair();
                        }
                    },
                };
            },

            close: async () => {

            },

            repair: async () => {
                debug('Repair requested');
                this.repairRequested = true;
                await this.startRepair();
            },
        };
    }

}
