
import * as puppeteer from 'puppeteer';
import ConcurrencyImplementation, { ResourceData } from './ConcurrencyImplementation';

import { debugGenerator, timeoutExecute } from '../util';
import {ClusterOptions} from '../Cluster';
const debug = debugGenerator('SingleBrowserImpl');

export default abstract class SingleBrowserImplementation extends ConcurrencyImplementation {

    protected browser: puppeteer.Browser | null = null;

    private repairing: boolean = false;
    private repairRequested: boolean = false;
    private openInstances: number = 0;
    private waitingForRepairResolvers: (() => void)[] = [];

    public constructor(options: puppeteer.LaunchOptions, puppeteer: any, clusterOptions: ClusterOptions) {
        super(options, puppeteer, clusterOptions);
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
            debug('Closing existing browser');
            await (<puppeteer.Browser>this.browser).close();
        } catch (e) {
            debug('Unable to close browser.');
        }
        debug('Closed existing browser');
        
        try {
            debug('Opening new browser');
            this.browser = await this.puppeteer.launch(this.options) as puppeteer.Browser;
        } catch (err) {
            debug(`Unable to launch chrome ${err}`);
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
        await (this.browser as puppeteer.Browser).close();
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

                await timeoutExecute(this.clusterOptions.browserTimeout, (async () => {
                    resources = await this.createResources();
                })());
                this.openInstances += 1;

                return {
                    resources,

                    close: async () => {
                        this.openInstances -= 1; // decrement first in case of error
                        await timeoutExecute(this.clusterOptions.browserTimeout, this.freeResources(resources));

                        if (this.repairRequested) {
                            await this.repair();
                        }
                    },
                };
            },

            close: async () => {},

            repair: async () => {
                debug('Repair requested');
                this.repairRequested = true;
                await this.repair();
            },
        };
    }
}
