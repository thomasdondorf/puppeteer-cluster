
import { URL } from 'url';
import { TaskFunction } from './Cluster';

// needs an URL, but can have any other information in it
export interface JobData {
    url: string;
    [x: string]: any;
}

export default class Job {

    public url: string | JobData | undefined;
    public taskFunction: TaskFunction | undefined;

    private lastError: Error | null = null;
    public tries: number = 0;

    public constructor(url: string | JobData | undefined, taskFunction?: TaskFunction) {
        this.url = url;
        this.taskFunction = taskFunction;
    }

    public getUrl(): string | undefined {
        if (this.url === undefined) {
            return undefined;
        }
        if (typeof this.url === 'string') {
            return this.url;
        }
        if ((typeof (this.url as JobData).url === 'string')) {
            return this.url.url;
        }
        return undefined;
    }

    public getDomain(): string | undefined {
        // TODO use tld.js to restrict to top-level domain?
        const urlStr = this.getUrl();
        if (urlStr) {
            const url = new URL(urlStr);
            return url.hostname || undefined;
        }
        return undefined;
    }

    public addError(error: Error): void {
        this.tries += 1;
        this.lastError = error;
    }

}
