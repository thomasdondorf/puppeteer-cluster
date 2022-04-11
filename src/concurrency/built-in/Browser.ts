import * as puppeteer from 'puppeteer';

import {debugGenerator, timeoutExecute} from '../../util';
import ConcurrencyImplementation, {WorkerInstance} from '../ConcurrencyImplementation';

const debug = debugGenerator('BrowserConcurrency');

const BROWSER_TIMEOUT = 5000;

export default class Browser extends ConcurrencyImplementation {
    public async init() {}
    public async close() {}

    public async workerInstance(perBrowserOptions: puppeteer.LaunchOptions | undefined):
        Promise<WorkerInstance> {

        const options = perBrowserOptions || this.options;
        let chrome = await this.puppeteer.launch(options) as puppeteer.Browser;
        let page: puppeteer.Page;
        let context: any; // puppeteer typings are old...

        return {
            jobInstance: async () => {
                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    page = await chrome.newPage();
                })());

                return {
                    resources: {
                        page,
                    },

                    close: async () => {
                        await timeoutExecute(BROWSER_TIMEOUT, page.close());
                    },
                };
            },

            close: async () => {
                await chrome.close();
            },

            repair: async () => {
                debug('Starting repair');
                try {
                    // will probably fail, but just in case the repair was not necessary
                    await chrome.close();
                } catch (e) {}

                // just relaunch as there is only one page per browser
                chrome = await this.puppeteer.launch(options);
            },
        };
    }

    requestRestart(): void {}
    
}
