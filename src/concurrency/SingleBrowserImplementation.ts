
import * as puppeteer from 'puppeteer';
import ConcurrencyImplementation, { ResourceData } from './ConcurrencyImplementation';

import { BROWSER_TIMEOUT, debugGenerator, timeoutExecute } from '../util';
const debug = debugGenerator('SingleBrowserImpl');
export default abstract class SingleBrowserImplementation extends ConcurrencyImplementation {

    protected browser: puppeteer.Browser | null = null;

    private repairing = false;
    private repairRequested = false;
    private openInstances = 0;
    private waitingForRepairResolvers: (() => void)[] = [];

    public constructor(options: puppeteer.LaunchOptions, puppeteer: any) {
        super(options, puppeteer);
    }

    private async repair() {
        if (this.openInstances !== 0 || this.repairing) {
            // already repairing or there are still pages open? wait for start/finish
            await new Promise<void>(resolve => this.waitingForRepairResolvers.push(resolve));
            return;
        }

        this.repairing = true;
        debug('Starting repair');

        try {
            // will probably fail, but just in case the repair was not necessary
            await timeoutExecute(BROWSER_TIMEOUT,  (<puppeteer.Browser>this.browser).close())
        } catch (e) {
            debug('Unable to close browser.');
        }

        try {
            this.browser = await this.puppeteer.launch(this.options) as puppeteer.Browser;
        } catch (err) {
            throw new Error('Unable to restart chrome.');
        }
        this.repairRequested = false;
        this.repairing = false;
        this.waitingForRepairResolvers.forEach(resolve => resolve());
        this.waitingForRepairResolvers = [];
    }

    public async init() {
        this.browser = await this.puppeteer.launch(this.options);
    }

    public async close() {
        await timeoutExecute(BROWSER_TIMEOUT,  (this.browser as puppeteer.Browser).close())
    }

    protected abstract createResources(): Promise<ResourceData>;

    protected abstract freeResources(resources: ResourceData): Promise<void>;

    public async workerInstance() {
        let resources: ResourceData;

        return {
            jobInstance: async () => {
                if (this.repairRequested) {
                    await this.repair();
                }

                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    resources = await this.createResources();
                })());
                this.openInstances += 1;

                return {
                    resources,

                    close: async () => {
                        this.openInstances -= 1; // decrement first in case of error
                        await timeoutExecute(BROWSER_TIMEOUT, this.freeResources(resources));

                        if (this.repairRequested) {
                            await this.repair();
                        }
                    },
                };
            },

            close: async () => {
                /* No Op */
            },

            repair: async () => {
                debug('Repair requested');
                this.repairRequested = true;
                await this.repair();
            },
        };
    }
}
