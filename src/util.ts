
import * as Debug from 'debug';

interface TimeUnit {
    step: number;
    name: string;
}

function timeUnit(step: number, name: string) : TimeUnit {
    return { step, name };
}

const TIME_UNITS: TimeUnit[] = [
    timeUnit(1, 'ms'),
    timeUnit(1000, 'seconds'),
    timeUnit(60, 'minutes'),
    timeUnit(60, 'hours'),
    timeUnit(24, 'days'),
    timeUnit(31, 'months'),
    timeUnit((365 / 31), 'years'),
];

const TIME_UNIT_THRESHOLD = 0.95;

function padDate(value: number|string, num: number): string {
    const str = value.toString();
    if (str.length >= num) {
        return str;
    }
    const zeroesToAdd = num - str.length;
    return '0'.repeat(zeroesToAdd) + str;
}

export function formatDateTime(datetime: Date | number): string {
    const date = (typeof datetime === 'number') ? new Date(datetime) : datetime;

    const dateStr = `${date.getFullYear()}`
        + `-${padDate(date.getMonth() + 1, 2)}`
        + `-${padDate(date.getDate(), 2)}`;
    const timeStr = `${padDate(date.getHours(), 2)}`
        + `:${padDate(date.getMinutes(), 2)}`
        + `:${padDate(date.getSeconds(), 2)}`
        + `.${padDate(date.getMilliseconds(), 3)}`;

    return `${dateStr} ${timeStr}`;
}

export function formatDuration(millis: number): string {
    if (millis < 0) {
        return 'unknown';
    }

    let remaining = millis;
    let nextUnitIndex = 1;
    while (nextUnitIndex < TIME_UNITS.length &&
            remaining / TIME_UNITS[nextUnitIndex].step >= TIME_UNIT_THRESHOLD) {
        remaining = remaining / TIME_UNITS[nextUnitIndex].step;
        nextUnitIndex += 1;
    }

    return `${remaining.toFixed(1)} ${TIME_UNITS[nextUnitIndex - 1].name}`;
}

export async function timeoutExecute<T>(millis: number, promise: Promise<T>): Promise<T> {

    let timeout: NodeJS.Timer | null = null;

    const result = await Promise.race([
        (async () => {
            await new Promise((resolve) => {
                timeout = setTimeout(resolve, millis);
            });
            throw new Error(`Timeout hit: ${millis}`);
        })(),
        (async () => {
            try {
                return await promise;
            } catch (error) {
                // Cancel timeout in error case
                clearTimeout(timeout as any as NodeJS.Timer);
                throw error;
            }
        })(),
    ]);
    clearTimeout(timeout as any as NodeJS.Timer); // is there a better way?
    return result;
}

export function debugGenerator(namespace: string): Debug.IDebugger {
    const debug = Debug(`puppeteer-cluster: ${namespace}`);
    return debug;
}

const logToConsole = Debug('puppeteer-cluster:log');
logToConsole.log = console.error.bind(console);

export function log(msg: string): void {
    logToConsole(msg);
}
