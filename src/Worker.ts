
import Job from './Job';
import Cluster from './Cluster';
import { WorkerBrowserInstance, ContextInstance } from './browser/AbstractBrowser';
import { Page } from 'puppeteer';
import { cancellableTimeout, CancellableTimeout } from './util';

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
            console.log('Error getting browser page: ' + err.message);
            await this.browser.repair();
            // TODO retry? await this.handle(task, job);
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
                (async () => {
                    await task({
                        page,
                        url: job.url,
                        cluster: this.cluster,
                        worker: {
                            id: this.id,
                        },
                        context: {},
                    });
                })(),
            ]);
        } catch (err) {
            // TODO special error message for status === Status.TIMEOUT as this might lead to errors
            //      inside the task handler (as the page gets closed) => point this out in the docs
            errorState = err;
            console.log('Error crawling ' + job.url + ' // ' + err.code + ': ' + err.message);
        }
        (<CancellableTimeout>taskTimeout).cancel();

        try {
            await browserInstance.close();
        } catch (e) {
            console.log('Error closing browser instance ' + job.url + ': ' + e.message);
            await this.browser.repair();
        }

        this.activeTarget = null;

        return errorState;
    }

    public async close(): Promise<void> {
        try {
            await this.browser.close();
        } catch (err) {
            console.log(`Unable to close worker browser. Error message: ${err.message}`);
        }
    }

}
