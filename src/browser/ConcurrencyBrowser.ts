
import AbstractBrowser, { WorkerBrowserInstance } from './AbstractBrowser';


// TODO get these two working together
const puppeteer = require('puppeteer');
import { Page } from 'puppeteer';

export default class ConcurrencyBrowser extends AbstractBrowser {


    async init() {}

    async close() {}

    async workerInstance(): Promise<WorkerBrowserInstance> {
        let chrome = await puppeteer.launch(this.options);
        let page: Page;
        let context: any; // puppeteer typings are old...

        return {
            instance: async () => {
                context = await chrome.createIncognitoBrowserContext();
                page = await context.newPage();

                return {
                    page,

                    close: async () => {
                        await page.close();
                        await context.close();
                    }
                }
            },

            close: async () => {
                await chrome.close();
            },

            repair: async () => {
                console.log('Starting repair');
                try {
                    // will probably fail, but just in case the repair was not necessary
                    await chrome.close();
                } catch (e) {}

                // just relaunch as there is only one page per browser, we can be sure that there is only one page open
                chrome = await puppeteer.launch(this.options);
            },
        }
    }

}
