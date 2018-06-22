
import { formatDateTime, formatDuration, cancellableTimeout } from '../src/util';

describe('formatDateTime', () => {

    test('formats dates', () => {
        expect(
            formatDateTime(new Date(1980, 11, 31, 18, 30, 51, 999)),
        ).toBe('1980-12-31 18:30:51.999');
    });

    test('zero-fills dates', () => {
        expect(
            formatDateTime(new Date(2018, 0, 7, 4, 5, 7, 12)),
        ).toBe('2018-01-07 04:05:07.012');
    });

    test('works also for numbers', () => {
        const now = new Date();
        const nowTimestamp = now.getTime();
        const nowStr = formatDateTime(now);
        expect(
            formatDateTime(nowTimestamp),
        ).toBe(nowStr);
    });

});

describe('formatDuration', () => {

    test('negative', () => {
        expect(formatDuration(-123))
        .toBe('unknown');
    });
    test('round up', () => {
        expect(formatDuration(995))
        .toBe('1.0 seconds');
    });
    test('milliseconds 1', () => {
        expect(formatDuration(0))
        .toBe('0.0 ms');
    });
    test('milliseconds 2', () => {
        expect(formatDuration(800))
        .toBe('800.0 ms');
    });
    test('seconds', () => {
        expect(formatDuration(10.29 * 1000))
        .toBe('10.3 seconds');
    });
    test('minutes', () => {
        expect(formatDuration(10.29 * 60 * 1000))
        .toBe('10.3 minutes');
    });
    test('hours', () => {
        expect(formatDuration(10.29 * 60 * 60 * 1000))
        .toBe('10.3 hours');
    });
    test('days', () => {
        expect(formatDuration(10.29 * 24 * 60 * 60 * 1000))
        .toBe('10.3 days');
    });
    test('months', () => {
        expect(formatDuration(10.29 * 31 * 24 * 60 * 60 * 1000))
        .toBe('10.3 months');
    });
    test('years', () => {
        expect(formatDuration(10.29 * 365 * 24 * 60 * 60 * 1000))
        .toBe('10.3 years');
    });

});

jest.useFakeTimers();

describe('cancellableTimeout', () => {

    test('resolve after some time', async () => {
        expect.assertions(1);

        const promiseWrapper = cancellableTimeout(100000);

        jest.runAllTimers();

        expect(promiseWrapper.promise).resolves.toBe(undefined);
    });

    test('is cancellable', async () => {
        expect.assertions(1);

        let promiseWrapper;

        (async () => {
            promiseWrapper = cancellableTimeout(100000);
            const result = await promiseWrapper.promise;
            expect(result).toBe(undefined);
        })();
        promiseWrapper.cancel();
    });

});
