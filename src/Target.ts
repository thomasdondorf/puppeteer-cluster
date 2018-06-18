import { DH_NOT_SUITABLE_GENERATOR } from "constants";

export default class Target {

    public url: string;
    private context: object;

    private error: Error | null = null;

    constructor(url: string, context: object = {}) {
        this.url = url;
        this.context = context;
    }

    setError(error: Error) {
        this.error = error;
    }

}



