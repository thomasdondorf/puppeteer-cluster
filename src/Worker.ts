
import Job from './Job';
import Cluster from './Cluster';
import { WorkerBrowserInstance, ContextInstance } from './browser/AbstractBrowser';
import { Page } from 'puppeteer';
import { cancellableTimeout, CancellableTimeout, debugGenerator, log } from './util';

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
    url: string;
    page: Page;
    cluster: Cluster;
    worker: {
        id: number;
    };
    context: object;
}

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
            task: ((_:TaskArguments) => Promise<void>),
            job: Job,
            timeout: number,
        ): Promise<Error | null> {
        this.activeTarget = job;

        let browserInstance: ContextInstance;
        let page: Page;

        try {
            browserInstance = await this.browser.instance();
            page = browserInstance.page;
        } catch (err) {
            debug('Error getting browser page: ' + err.message);
            await this.browser.repair();
            // TODO log how often this does not work to escalte when it happens to often?
            return err;
        }

        let errorState: Error | null = null;
        let taskTimeout: CancellableTimeout | null = null;

        try {
            taskTimeout = cancellableTimeout(timeout);
            await Promise.race([
                (async () => { // timeout promise
                    await taskTimeout.promise;
                    throw new Error('Timeout hit: ' + timeout);
                })(),
                task({
                    page,
                    url: job.url,
                    cluster: this.cluster,
                    worker: {
                        id: this.id,
                    },
                    context: {},
                }),
            ]);
        } catch (err) {
            errorState = err;
            log('Error crawling ' + job.url + ' // ' + err.code + ': ' + err.message);
        }
        (<CancellableTimeout>taskTimeout).cancel();

        try {
            await browserInstance.close();
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
