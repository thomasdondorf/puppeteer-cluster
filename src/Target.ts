
export default class Target {

    public url: string;
    private context: object;

    private lastError: Error | null = null;
    public tries: number = 0;

    public constructor(url: string, context: object = {}) {
        this.url = url;
        this.context = context;
    }

    public addError(error: Error): void {
        this.tries += 1;
        this.lastError = error;
    }

}
