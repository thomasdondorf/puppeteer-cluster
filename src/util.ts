
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

export function formatDateTime(datetime: Date | number): string {
    const date = (typeof datetime === 'number') ? new Date(datetime) : datetime;

    const dateStr = `${date.getFullYear()}`
        + `-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        + `-${(date.getDate()).toString().padStart(2, '0')}`;
    const timeStr = `${date.getHours().toString().padStart(2, '0')}`
        + `:${date.getMinutes().toString().padStart(2, '0')}`
        + `:${date.getSeconds().toString().padStart(2, '0')}`
        + `.${date.getMilliseconds().toString().padStart(3, '0')}`;

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

export interface CancellableTimeout {
    cancel: () => void;
    promise: Promise<void>;
}

export function cancellableTimeout(millis: number): CancellableTimeout {
    let timeout: NodeJS.Timer;
    let resolveCb: () => void;

    return {
        cancel: () => {
            resolveCb();
            clearTimeout(timeout);
        },
        promise: new Promise((resolve) => {
            resolveCb = resolve;
            timeout = setTimeout(resolve, millis);
        }),
    };
}

export function debugGenerator(namespace: string): Debug.IDebugger {
    const debug = Debug('puppeteer-cluster:' + namespace);
    return debug;
}

const logToConsole = Debug('puppeteer-cluster:log');
logToConsole.log = console.error.bind(console);

export function log(msg: string): void {
    logToConsole(msg);
}
