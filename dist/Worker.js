"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const util_2 = require("util");
const debug = util_1.debugGenerator('Worker');
const DEFAULT_OPTIONS = {
    args: [],
};
const BROWSER_INSTANCE_TRIES = 10;
class Worker {
    constructor({ cluster, args, id, browser }) {
        this.activeTarget = null;
        this.cluster = cluster;
        this.args = args;
        this.id = id;
        this.browser = browser;
        debug(`Starting #${this.id}`);
    }
    handle(task, job, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            this.activeTarget = job;
            let jobInstance = null;
            let page = null;
            let tries = 0;
            while (jobInstance === null) {
                try {
                    jobInstance = yield this.browser.jobInstance();
                    page = jobInstance.resources.page;
                }
                catch (err) {
                    debug(`Error getting browser page (try: ${tries}), message: ${err.message}`);
                    yield this.browser.repair();
                    tries += 1;
                    if (tries >= BROWSER_INSTANCE_TRIES) {
                        throw new Error('Unable to get browser page');
                    }
                }
            }
            // We can be sure that page is set now, otherwise an exception would've been thrown
            page = page; // this is just for TypeScript
            let errorState = null;
            page.on('error', (err) => {
                errorState = err;
                util_1.log(`Error (page error) crawling ${util_2.inspect(job.data)} // message: ${err.message}`);
            });
            debug(`Executing task on worker #${this.id} with data: ${util_2.inspect(job.data)}`);
            let result;
            try {
                result = yield util_1.timeoutExecute(timeout, task({
                    page,
                    // data might be undefined if queue is only called with a function
                    // we ignore that case, as the user should use Cluster<undefined> in that case
                    // to get correct typings
                    data: job.data,
                    worker: {
                        id: this.id,
                    },
                }));
            }
            catch (err) {
                errorState = err;
                util_1.log(`Error crawling ${util_2.inspect(job.data)} // message: ${err.message}`);
            }
            debug(`Finished executing task on worker #${this.id}`);
            try {
                yield jobInstance.close();
            }
            catch (e) {
                debug(`Error closing browser instance for ${util_2.inspect(job.data)}: ${e.message}`);
                yield this.browser.repair();
            }
            this.activeTarget = null;
            if (errorState) {
                return {
                    type: 'error',
                    error: errorState || new Error('asf'),
                };
            }
            return {
                data: result,
                type: 'success',
            };
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.browser.close();
            }
            catch (err) {
                debug(`Unable to close worker browser. Error message: ${err.message}`);
            }
            debug(`Closed #${this.id}`);
        });
    }
}
exports.default = Worker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1dvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUlBLGlDQUE2RDtBQUM3RCwrQkFBK0I7QUFHL0IsTUFBTSxLQUFLLEdBQUcscUJBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUV2QyxNQUFNLGVBQWUsR0FBRztJQUNwQixJQUFJLEVBQUUsRUFBRTtDQUNYLENBQUM7QUFTRixNQUFNLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztBQWNsQyxNQUFxQixNQUFNO0lBU3ZCLFlBQW1CLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFpQjtRQUZoRSxpQkFBWSxHQUFvQyxJQUFJLENBQUM7UUFHakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUV2QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRVksTUFBTSxDQUNYLElBQXVDLEVBQ3ZDLEdBQTZCLEVBQzdCLE9BQWU7O1lBRW5CLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1lBRXhCLElBQUksV0FBVyxHQUF1QixJQUFJLENBQUM7WUFDM0MsSUFBSSxJQUFJLEdBQWdCLElBQUksQ0FBQztZQUU3QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7WUFFZCxPQUFPLFdBQVcsS0FBSyxJQUFJLEVBQUU7Z0JBQ3pCLElBQUk7b0JBQ0EsV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO2lC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