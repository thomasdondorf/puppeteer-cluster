
import { formatDateTime, formatDuration, timeoutExecute } from '../src/util';

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

describe('timeoutExecute', () => {
    jest.useRealTimers();

    test('timeout after given time', async () => {
        expect.assertions(1);

        try {
            await timeoutExecute(
                10,
                new Promise(resolve => setTimeout(resolve, 50)),
            );
            fail();
        } catch (e) {
            expect(e.message).toEqual(expect.stringContaining('Timeout'));
        }
    });

    test('execute promise before timeout', async () => {
        const result = await timeoutExecute(
            50,
            new Promise(resolve => setTimeout(() => resolve(123), 10)),
        );
        expect(result).toBe(123);
    });

    test('cancel timeout when promise resolves', async () => {
        const result = await timeoutExecute(
            100000,
            new Promise(resolve => setTimeout(() => resolve(123), 10)),
        );
        expect(result).toBe(123);
    });

});
