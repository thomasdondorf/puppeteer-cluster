
// needs an URL, but can have any other information in it
export interface JobData {
    url: string;
    [x: string]: any;
}

export default class Job {

    public url: string | JobData;

    private lastError: Error | null = null;
    public tries: number = 0;

    public constructor(url: string | JobData) {
        this.url = url;
    }

    public getUrl(): string | undefined {
        if (typeof this.url === 'string') {
            return this.url;
        }
        if ((typeof (this.url as JobData).url === 'string')) {
            return this.url.url;
        }
        return undefined;
    }

    public addError(error: Error): void {
        this.tries += 1;
        this.lastError = error;
    }

}
