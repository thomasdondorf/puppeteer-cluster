import * as os from 'os';

interface SystemLoad {
    idle: number;
    total: number;
}

const INIT_INTERVAL = 50;
const MEASURE_INTERVAL = 500;

export default class SystemMonitor {

    private cpuUsage: number = 0;
    private memoryUsage: number = 0;

    private lastLoad: SystemLoad | null = null;

    private interval: NodeJS.Timer | null = null;

    // After init is called there is at least something in the cpuUsage thingy
    public init() {
        this.calcLoad();
        return new Promise((resolve) => {
            setTimeout(
                () => {
                    this.calcLoad();
                    this.interval = setInterval(() => this.calcLoad(), MEASURE_INTERVAL);
                    resolve();
                },
                INIT_INTERVAL,
            );
        });
    }

    public close() {
        clearInterval(this.interval as NodeJS.Timer);
    }

    private calcLoad() { // based on https://gist.github.com/bag-man/5570809
        // Initialise sum of idle and time of cores and fetch CPU info
        let totalIdle = 0;
        let totalTick = 0;
        const cpus = os.cpus();

        // Loop through CPU cores
        for (let i = 0, len = cpus.length; i < len; i += 1) {
            const cpu = cpus[i];

            for (const type in cpu.times) {
                totalTick += (cpu.times as any)[type];
            }
            totalIdle += cpu.times.idle;
        }

        const currentLoad = {
            idle: totalIdle / cpus.length,
            total: totalTick / cpus.length,
        };

        if (this.lastLoad !== null) {
            const idleDifference = currentLoad.idle - this.lastLoad.idle;
            const totalDifference = currentLoad.total - this.lastLoad.total;

            this.cpuUsage = 100 - (100 * idleDifference / totalDifference);
            this.memoryUsage = 100 - (100 * os.freemem() / os.totalmem());
        }

        this.lastLoad = currentLoad;
    }

    public getCpuUsage() {
        return this.cpuUsage;
    }
    public getMemoryUsage() {
        return this.memoryUsage;
    }
}
