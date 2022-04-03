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
const debug = (0, util_1.debugGenerator)('Worker');
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
                (0, util_1.log)(`Error (page error) crawling ${(0, util_2.inspect)(job.data)} // message: ${err.message}`);
            });
            debug(`Executing task on worker #${this.id} with data: ${(0, util_2.inspect)(job.data)}`);
            let result;
            try {
                result = yield (0, util_1.timeoutExecute)(timeout, task({
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
                (0, util_1.log)(`Error crawling ${(0, util_2.inspect)(job.data)} // message: ${err.message}`);
            }
            debug(`Finished executing task on worker #${this.id}`);
            try {
                yield jobInstance.close();
            }
            catch (e) {
                debug(`Error closing browser instance for ${(0, util_2.inspect)(job.data)}: ${e.message}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1dvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUtBLGlDQUE2RDtBQUM3RCwrQkFBK0I7QUFHL0IsTUFBTSxLQUFLLEdBQUcsSUFBQSxxQkFBYyxFQUFDLFFBQVEsQ0FBQyxDQUFDO0FBU3ZDLE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxDQUFDO0FBY2xDLE1BQXFCLE1BQU07SUFTdkIsWUFBbUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQWlCO1FBRmhFLGlCQUFZLEdBQW9DLElBQUksQ0FBQztRQUdqRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFWSxNQUFNLENBQ1gsSUFBdUMsRUFDdkMsR0FBNkIsRUFDN0IsT0FBZTs7WUFFbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7WUFFeEIsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQztZQUMzQyxJQUFJLElBQUksR0FBZ0IsSUFBSSxDQUFDO1lBRTdCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVkLE9BQU8sV0FBVyxLQUFLLElBQUksRUFBRTtnQkFDekIsSUFBSTtvQkFDQSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUMvQyxJQUFJLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7aUJBQ3JDO2dCQUFDLE9BQU8sR0FBUSxFQUFFO29CQUNmLEtBQUssQ0FBQyxvQ0FB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