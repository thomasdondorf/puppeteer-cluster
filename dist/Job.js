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
    getUserbrowser() {
        if (!this.data) {
            return undefined;
        }
        if (typeof this.data === 'string') {
            return undefined;
        }
        if (typeof this.data.userbrowser === 'object') {
            return this.data.userbrowser;
        }
        return undefined;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSm9iLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0pvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUF3QjtBQVV4QixNQUFxQixHQUFHO0lBU3BCLFlBQ0ksSUFBYyxFQUNkLFlBQWdELEVBQ2hELGdCQUFtQztRQU4vQixjQUFTLEdBQWlCLElBQUksQ0FBQztRQUNoQyxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBT3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQUM3QyxDQUFDO0lBRU0sY0FBYztRQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNaLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQy9CLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBRUQsSUFBSSxPQUFRLElBQUksQ0FBQyxJQUFZLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRTtZQUNwRCxPQUFRLElBQUksQ0FBQyxJQUFZLENBQUMsV0FBVyxDQUFDO1NBQ3pDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVNLE1BQU07UUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNaLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQy9CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztTQUNwQjtRQUNELElBQUksT0FBUSxJQUFJLENBQUMsSUFBWSxDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUU7WUFDNUMsT0FBUSxJQUFJLENBQUMsSUFBWSxDQUFDLEdBQUcsQ0FBQztTQUNqQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFTSxTQUFTO1FBQ1osbURBQW1EO1FBQ25ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM3QixJQUFJLE1BQU0sRUFBRTtZQUNSLElBQUk7Z0JBQ0EsTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLE9BQU8sR0FBRyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUM7YUFDcEM7WUFBQyxPQUFPLENBQU0sRUFBRTtnQkFDYixnREFBZ0Q7Z0JBQ2hELGdDQUFnQztnQkFDaEMsT0FBTyxTQUFTLENBQUM7YUFDcEI7U0FDSjtRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFTSxRQUFRLENBQUMsS0FBWTtRQUN4QixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUMzQixDQUFDO0NBRUo7QUFuRUQsc0JBbUVDIn0=