
import { Page } from 'puppeteer';

export interface ContextInstance {
    page: Page,
    close: () => Promise<void>,
};

export interface WorkerBrowserInstance {
    instance: () => Promise<ContextInstance>;
    close: () => Promise<void>;
    repair: () => Promise<void>;
};

export default abstract class AbstractBrowser {

    protected options: object;

    constructor(options: object) { // TODO specify object
        this.options = options;
    }

    abstract async init(): Promise<void>;
    abstract async close(): Promise<void>;

    abstract async workerInstance(): Promise<WorkerBrowserInstance>;

}
