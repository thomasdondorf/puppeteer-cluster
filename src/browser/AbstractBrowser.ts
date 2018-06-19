
import { Page, LaunchOptions } from 'puppeteer';

export interface ContextInstance {
    page: Page;
    close: () => Promise<void>;
}

export interface WorkerBrowserInstance {
    instance: () => Promise<ContextInstance>;
    close: () => Promise<void>;
    repair: () => Promise<void>;
}

export default abstract class AbstractBrowser {

    protected options: LaunchOptions;

    public constructor(options: LaunchOptions) { // TODO specify object
        this.options = options;
    }

    public abstract async init(): Promise<void>;
    public abstract async close(): Promise<void>;

    public abstract async workerInstance(): Promise<WorkerBrowserInstance>;

}
