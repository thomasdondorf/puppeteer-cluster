
import Job, { JobData } from './Job';
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

export interface TaskArguments {
    worker: {
        id: number;
    };
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

        let errorState: Error | null = null;

        try {
            await timeoutExecute(
                timeout,
                task((page as Page), job.url, {
                    worker: { id: this.id },
                }),
            );
        } catch (err) {
            errorState = err;
            log('Error crawling ' + job.url + ' // message: ' + err.message);
        }

        try {
            await timeoutExecute(BROWSER_TIMEOUT, browserInstance.close());
        } catch (e) {
            debug('Error closing browser instance for ' + job.url + ': ' + e.message);
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
