
export default class Target {

    public url: string;
    private context: object;

    private error: Error | null = null;

    public constructor(url: string, context: object = {}) {
        this.url = url;
        this.context = context;
    }

    public setError(error: Error): void {
        this.error = error;
    }

}
