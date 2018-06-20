
export interface JobOptions {
    priority?: number;
    retry?: number;
    delayUntil?: number;
    timeout?: number;
    data?: object;
}

export default class Job {

    public url: string;
    public options: JobOptions;

    private lastError: Error | null = null;
    public tries: number = 0;

    public constructor(url: string, options: JobOptions = {}) {
        this.url = url;
        this.options = options;
    }

    public addError(error: Error): void {
        this.tries += 1;
        this.lastError = error;
    }

}
