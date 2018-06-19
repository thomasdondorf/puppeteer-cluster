
import Target from './Target';
import Cluster from './Cluster';
import { WorkerBrowserInstance, ContextInstance } from './browser/AbstractBrowser';
import { Page } from 'puppeteer';

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

    activeTarget: Target | null = null;

    public static async launch(options: WorkerOptions): Promise<Worker> {
        const worker = new Worker(options);
        await worker.init();

        return worker;
    }

    private constructor({ cluster, args, id, browser }: WorkerOptions) {
        this.cluster = cluster;
        this.args = args;
        this.id = id;

        this.browser = browser;
    }

    private async init(): Promise<void> {}

    public async handle(task: ((_:TaskArguments) => Promise<void>), target: Target): Promise<void> {
        this.activeTarget = target;

        let browserInstance: ContextInstance;
        let page: Page;

        try {
            browserInstance = await this.browser.instance();
            page = browserInstance.page;
        } catch (err) {
            console.log('Error getting browser page: ' + err.message);
            await this.browser.repair();
            // TODO retry? await this.handle(task, target);
            return;
        }

        try {
            await task({
                page,
                url: target.url,
                cluster: this.cluster,
                worker: {
                    id: this.id,
                },
                context: {},
            });
        } catch (err) {
            console.log('Error crawling ' + target.url + ' // ' + err.code + ': ' + err.message);
            target.setError(err);
        }

        try {
            await browserInstance.close();
        } catch (e) {
            console.log('Error closing browser instance ' + target.url + ': ' + e.message);
            await this.browser.repair();
        }

        this.activeTarget = null;
    }

    public async close(): Promise<void> {
        try {
            await this.browser.close();
        } catch (err) {
            console.log(`Unable to close worker browser. Error message: ${err.message}`);
        }
    }

}
