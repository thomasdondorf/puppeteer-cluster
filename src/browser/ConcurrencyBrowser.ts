
import AbstractBrowser, { WorkerBrowserInstance } from './AbstractBrowser';
import * as puppeteer from 'puppeteer';

import { debugGenerator, timeoutExecute } from '../util';
const debug = debugGenerator('Browser');

const BROWSER_TIMEOUT = 5000;

export default class ConcurrencyBrowser extends AbstractBrowser {
    public async init() {}
    public async close() {}

    public async workerInstance(): Promise<WorkerBrowserInstance> {
        let chrome = await puppeteer.launch(this.options);
        let page: puppeteer.Page;
        let context: any; // puppeteer typings are old...

        return {
            instance: async () => {
                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    context = await chrome.createIncognitoBrowserContext();
                    page = await context.newPage();
                })());

                return {
                    page,

                    close: async () => {
                        await timeoutExecute(BROWSER_TIMEOUT, context.close());
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
                chrome = await puppeteer.launch(this.options);
            },
        };
    }

}
