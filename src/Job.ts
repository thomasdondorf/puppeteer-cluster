
import { URL } from 'url';
import { TaskFunction } from './Cluster';

export type JobData = any;

export default class Job {

    public data: JobData;
    public taskFunction: TaskFunction | undefined;

    private lastError: Error | null = null;
    public tries: number = 0;

    public constructor(data: JobData, taskFunction?: TaskFunction) {
        this.data = data;
        this.taskFunction = taskFunction;
    }

    public getUrl(): string | undefined {
        if (this.data === undefined) {
            return undefined;
        }
        if (typeof this.data === 'string') {
            return this.data;
        }
        if (this.data !== undefined && typeof this.data.url === 'string') {
            return this.data.url;
        }
        return undefined;
    }

    public getDomain(): string | undefined {
        // TODO use tld.js to restrict to top-level domain?
        const urlStr = this.getUrl();
        if (urlStr) {
            try {
                const url = new URL(urlStr);
                return url.hostname || undefined;
            } catch (e) {
                // if urlStr is not a valid URL this might throw
                // but we leave this to the user
                return undefined;
            }
        }
        return undefined;
    }

    public addError(error: Error): void {
        this.tries += 1;
        this.lastError = error;
    }

}
