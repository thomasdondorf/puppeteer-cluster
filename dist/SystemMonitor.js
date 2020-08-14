"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const INIT_INTERVAL = 50;
const MEASURE_INTERVAL = 200;
// timespan of which to measure load
// must be a multiple of MEASURE_INTERVAL
const MEASURE_TIMESPAN = 5000;
const loadListSize = MEASURE_TIMESPAN / MEASURE_INTERVAL;
class SystemMonitor {
    constructor() {
        this.cpuUsage = 0;
        this.memoryUsage = 0;
        this.loads = [];
        this.interval = null;
    }
    // After init is called there is at least something in the cpuUsage thingy
    init() {
        this.calcLoad();
        return new Promise((resolve) => {
            setTimeout(() => {
                this.calcLoad();
                this.interval = setInterval(() => this.calcLoad(), MEASURE_INTERVAL);
                resolve();
            }, INIT_INTERVAL);
        });
    }
    close() {
        clearInterval(this.interval);
    }
    calcLoad() {
        let totalIdle = 0;
        let totalTick = 0;
        const cpus = os.cpus();
        if (!cpus) {
            // In some environments, os.cpus() might return undefined (although it's not stated in
            // the Node.js docs), see #113 for more information
            return;
        }
        for (let i = 0, len = cpus.length; i < len; i += 1) {
            const cpu = cpus[i];
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        const currentLoad = {
            idle: totalIdle / cpus.length,
            total: totalTick / cpus.length,
        };
        if (this.loads.length !== 0) {
            const compareLoad = this.loads[0];
            const idleDifference = currentLoad.idle - compareLoad.idle;
            const totalDifference = currentLoad.total - compareLoad.total;
            this.cpuUsage = 100 - (100 * idleDifference / totalDifference);
            this.memoryUsage = 100 - (100 * os.freemem() / os.totalmem());
        }
        this.loads.push(currentLoad);
        if (this.loads.length > loadListSize) {
            // remove oldest entry
            this.loads.shift();
        }
    }
    getCpuUsage() {
        return this.cpuUsage;
    }
    getMemoryUsage() {
        return this.memoryUsage;
    }
}
exports.default = SystemMonitor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3lzdGVtTW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9TeXN0ZW1Nb25pdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseUJBQXlCO0FBT3pCLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUN6QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztBQUU3QixvQ0FBb0M7QUFDcEMseUNBQXlDO0FBQ3pDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBRTlCLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO0FBRXpELE1BQXFCLGFBQWE7SUFBbEM7UUFFWSxhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBQ3JCLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBRXhCLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBRXpCLGFBQVEsR0FBd0IsSUFBSSxDQUFDO0lBbUVqRCxDQUFDO0lBakVHLDBFQUEwRTtJQUNuRSxJQUFJO1FBQ1AsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUMzQixVQUFVLENBQ04sR0FBRyxFQUFFO2dCQUNELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3JFLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQyxFQUNELGFBQWEsQ0FDaEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLEtBQUs7UUFDUixhQUFhLENBQUMsSUFBSSxDQUFDLFFBQXdCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRU8sUUFBUTtRQUNaLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXZCLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxzRkFBc0Y7WUFDdEYsbURBQW1EO1lBQ25ELE9BQU87U0FDVjtRQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsS0FBSyxNQUFNLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO2dCQUMxQixTQUFTLElBQUssR0FBRyxDQUFDLEtBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN6QztZQUNELFNBQVMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztTQUMvQjtRQUVELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU07WUFDN0IsS0FBSyxFQUFFLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTTtTQUNqQyxDQUFDO1FBRUYsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDekIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUM7WUFDM0QsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBRTlELElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLGNBQWMsR0FBRyxlQUFlLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDakU7UUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFlBQVksRUFBRTtZQUNsQyxzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN0QjtJQUNMLENBQUM7SUFFTSxXQUFXO1FBQ2QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3pCLENBQUM7SUFDTSxjQUFjO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUM1QixDQUFDO0NBQ0o7QUExRUQsZ0NBMEVDIn0=