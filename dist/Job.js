"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
class Job {
    constructor(data, taskFunction, executeCallbacks) {
        this.lastError = null;
        this.tries = 0;
        this.data = data;
        this.taskFunction = taskFunction;
        this.executeCallbacks = executeCallbacks;
    }
    getUrl() {
        if (!this.data) {
            return undefined;
        }
        if (typeof this.data === 'string') {
            return this.data;
        }
        if (typeof this.data.url === 'string') {
            return this.data.url;
        }
        return undefined;
    }
    getDomain() {
        // TODO use tld.js to restrict to top-level domain?
        const urlStr = this.getUrl();
        if (urlStr) {
            try {
                const url = new url_1.URL(urlStr);
                return url.hostname || undefined;
            }
            catch (e) {
                // if urlStr is not a valid URL this might throw
                // but we leave this to the user
                return undefined;
            }
        }
        return undefined;
    }
    addError(error) {
        this.tries += 1;
        this.lastError = error;
    }
}
exports.default = Job;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSm9iLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0pvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZCQUEwQjtBQVUxQixNQUFxQixHQUFHO0lBU3BCLFlBQ0ksSUFBYyxFQUNkLFlBQWdELEVBQ2hELGdCQUFtQztRQU4vQixjQUFTLEdBQWlCLElBQUksQ0FBQztRQUNoQyxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBT3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQUM3QyxDQUFDO0lBRU0sTUFBTTtRQUNULElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1osT0FBTyxTQUFTLENBQUM7U0FDcEI7UUFDRCxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQ3BCO1FBQ0QsSUFBSSxPQUFRLElBQUksQ0FBQyxJQUFZLENBQUMsR0FBRyxLQUFLLFFBQVEsRUFBRTtZQUM1QyxPQUFRLElBQUksQ0FBQyxJQUFZLENBQUMsR0FBRyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVNLFNBQVM7UUFDWixtREFBbUQ7UUFDbkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzdCLElBQUksTUFBTSxFQUFFO1lBQ1IsSUFBSTtnQkFDQSxNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxHQUFHLENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQzthQUNwQztZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLGdEQUFnRDtnQkFDaEQsZ0NBQWdDO2dCQUNoQyxPQUFPLFNBQVMsQ0FBQzthQUNwQjtTQUNKO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFZO1FBQ3hCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQzNCLENBQUM7Q0FFSjtBQXJERCxzQkFxREMifQ==