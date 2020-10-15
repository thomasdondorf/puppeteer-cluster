import Job from './Job';
import { TaskFunction } from './Cluster';
import { debugGenerator, log, timeoutExecute } from './util';
import { inspect } from 'util';
import { WorkerInstance } from './concurrency/ConcurrencyImplementation';

const debug = debugGenerator('Worker');

interface WorkerOptions {
    id: number;
    browser: WorkerInstance;
}

const BROWSER_INSTANCE_TRIES = 10;

export interface WorkError {
    type: 'error';
    error: Error;
}

export interface WorkData {
    type: 'success';
    data: any;
}

export type WorkResult = WorkError | WorkData;

const success = (data: any): WorkData => ({
    data,
    type: 'success',
});

const error = (errorState?: Error): WorkError => ({
    type: 'error',
    error: errorState || new Error(),
});

export default class Worker<JobData, ReturnData> {
    id: number;
    browser: WorkerInstance;

    activeTarget: Job<JobData, ReturnData> | null = null;

    public constructor({ id, browser }: WorkerOptions) {
        this.id = id;
        this.browser = browser;

        debug(`Starting #${this.id}`);
    }

    public async handle(
            task: TaskFunction<JobData, ReturnData>,
            job: Job<JobData, ReturnData>,
            timeout: number,
        ): Promise<WorkResult> {
        this.activeTarget = job;

        const jobInstance = await this.getJobInstance();
        const page = jobInstance.resources.page;

        let errorState: Error | null = null;

        page.on('error', (err) => {
            errorState = err;
            log(`Error (page error) crawling ${inspect(job.data)} // message: ${err.message}`);
        });

        debug(`Executing task on worker #${this.id} with data: ${inspect(job.data)}`);

        let result: any;
        try {
            result = await timeoutExecute(
                timeout,
                task({
                    page,
                    // data might be undefined if queue is only called with a function
                    // we ignore that case, as the user should use Cluster<undefined> in that case
                    // to get correct typings
                    data: job.data as JobData,
                    worker: {
                        id: this.id,
                    },
                }),
            );
        } catch (err) {
            errorState = err;
            log(`Error crawling ${inspect(job.data)} // message: ${err.message}`);
        }

        debug(`Finished executing task on worker #${this.id}`);

        try {
            await jobInstance.close();
        } catch (e) {
            debug(`Error closing browser instance for ${inspect(job.data)}: ${e.message}`);
            await this.browser.repair();
        }

        this.activeTarget = null;
        return errorState ? error(errorState) : success(result);
    }

    private async getJobInstance() {
        for (let attempt = 0; attempt < BROWSER_INSTANCE_TRIES; attempt += 1) {
            try {
                return await this.browser.jobInstance();
            } catch (err) {
                debug(`Error getting browser page (try: ${attempt}), message: ${err.message}`);
                await this.browser.repair();
            }
        }

        throw new Error('Unable to get browser page');
    }

    public async close(): Promise<void> {
        try {
            await this.browser.close();
        } catch (err) {
            debug(`Unable to close worker browser. Error message: ${err.message}`);
        }
        debug(`Closed #${this.id}`);
    }

}
