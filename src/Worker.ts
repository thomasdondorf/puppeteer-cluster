
import Job from './Job';
import Cluster, { TaskFunction } from './Cluster';
import { WorkerBrowserInstance, ContextInstance } from './browser/AbstractBrowser';
import { Page } from 'puppeteer';
import { timeoutExecute, debugGenerator, log } from './util';

const debug = debugGenerator('Worker');

const DEFAULT_OPTIONS = {
    args: [],
};

interface WorkerOptions {
    cluster: Cluster;
    args: string[];
    id: number;
    browser: WorkerBrowserInstance;
}

const BROWSER_TIMEOUT = 5000;

const BROWSER_INSTANCE_TRIES = 10;

export default class Worker implements WorkerOptions {

    cluster: Cluster;
    args: string[];
    id: number;
    browser: WorkerBrowserInstance;

    activeTarget: Job | null = null;

    public constructor({ cluster, args, id, browser }: WorkerOptions) {
        this.cluster = cluster;
        this.args = args;
        this.id = id;
        this.browser = browser;

        debug(`Starting #${this.id}`);
    }

    public async handle(
            task: TaskFunction,
            job: Job,
            timeout: number,
        ): Promise<Error | null> {
        this.activeTarget = job;

        let browserInstance: ContextInstance | null = null;
        let page: Page | null = null;

        let tries = 0;

        while (browserInstance === null) {
            try {
                browserInstance = await timeoutExecute(BROWSER_TIMEOUT, this.browser.instance());
                page = browserInstance.page;
            } catch (err) {
                debug(`Error getting browser page (try: ${tries}), message: ${err.message}`);
                await this.browser.repair();
                tries += 1;
                if (tries >= BROWSER_INSTANCE_TRIES) {
                    throw new Error('Unable to get browser page');
                }
            }
        }

         // We can be sure that page is set now, otherwise an exception would've been thrown
        page = page as Page; // this is just for TypeScript

        let errorState: Error | null = null;

        page.on('error', (err) => {
            errorState = err;
            log('Error (page error) crawling ' + JSON.stringify(job.data)
                + ' // message: ' + err.message);
        });

        try {
            await timeoutExecute(
                timeout,
                task({
                    page,
                    data: job.data,
                    worker: {
                        id: this.id,
                    },
                }),
            );
        } catch (err) {
            errorState = err;
            log('Error crawling ' + JSON.stringify(job.data) + ' // message: ' + err.message);
        }

        try {
            await timeoutExecute(BROWSER_TIMEOUT, browserInstance.close());
        } catch (e) {
            debug('Error closing browser instance for ' + + JSON.stringify(job.data)
                + ': ' + e.message);
            await this.browser.repair();
        }

        this.activeTarget = null;

        return errorState;
    }

    public async close(): Promise<void> {
        try {
            await this.browser.close();
        } catch (err) {
            debug(`Unable to close worker browser. Error message: ${err.message}`);
        }
        debug(`Closed #${this.id}`);
    }

}
