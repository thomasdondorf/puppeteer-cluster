import Cluster from '../src/Cluster';
import * as http from 'http';

let testServer;

const TEST_URL = 'http://127.0.0.1:3001/';

beforeAll(async () => {
    // test server
    await new Promise((resolve) => {
        testServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body>puppeteer-cluster TEST</body></html>');
        }).listen(3001, '127.0.0.1', resolve);
    });
});

afterAll(() => {
    testServer.close();
});

async function cookieTest(concurrencyType) {
    const cluster = await Cluster.launch({
        puppeteerOptions: { args: ['--no-sandbox'] },
        maxConcurrency: 1,
        concurrency: concurrencyType,
    });

    const randomValue = Math.random().toString();

    cluster.task(async ({ page, data: url }) => {
        await page.goto(url);
        const cookies = await page.cookies();

        cookies.forEach(({ name, value }) => {
            if (name === 'puppeteer-cluster-testcookie' && value === randomValue) {
                expect(true).toBe(true);
            }
        });

        await page.setCookie({
            name: 'puppeteer-cluster-testcookie',
            value: randomValue,
            url: TEST_URL,
        });
    });

    // one job sets the cookie, the other page reads the cookie
    cluster.queue(TEST_URL);
    cluster.queue(TEST_URL);

    await cluster.idle();
    await cluster.close();
}

describe('options', () => {

    test('cookie sharing in Cluster.CONCURRENCY_PAGE', async () => {
        expect.assertions(1);
        await cookieTest(Cluster.CONCURRENCY_PAGE);
    });

    test('no cookie sharing in Cluster.CONCURRENCY_CONTEXT', async () => {
        expect.assertions(0);
        await cookieTest(Cluster.CONCURRENCY_CONTEXT);
    });

    test('no cookie sharing in Cluster.CONCURRENCY_BROWSER', async () => {
        expect.assertions(0);
        await cookieTest(Cluster.CONCURRENCY_BROWSER);
    });

    // repeat remaining tests for all concurrency options

    [
        Cluster.CONCURRENCY_PAGE,
        Cluster.CONCURRENCY_CONTEXT,
        Cluster.CONCURRENCY_BROWSER,
    ].forEach((concurrency) => {
        describe('concurrency: ' + concurrency, () => {

            test('skipDuplicateUrls', async () => {
                expect.assertions(1);

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    skipDuplicateUrls: true,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                cluster.task(async ({ page, data: url }) => {
                    expect(url).toBe(TEST_URL);
                });

                cluster.queue(TEST_URL);
                cluster.queue(TEST_URL);

                await cluster.idle();
                await cluster.close();
            });

            test('skipDuplicateUrls (parallel)', async () => {
                expect.assertions(1);

                const sameUrl = 'http://www.google.com/';

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 2,
                    skipDuplicateUrls: true,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                cluster.task(async ({ page, data: url }) => {
                    expect(url).toBe(sameUrl);
                });

                cluster.queue(sameUrl);
                cluster.queue(sameUrl);

                await cluster.idle();
                await cluster.close();
            });

            test('retryLimit', async () => {
                expect.assertions(4); // 3 retries -> 4 times called

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    retryLimit: 3,
                });

                cluster.task(async ({ page, data: url }) => {
                    expect(true).toBe(true);
                    throw new Error('testing retryLimit');
                });

                cluster.queue(TEST_URL);

                await cluster.idle();
                await cluster.close();
            });

            test('waitForOne', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                });
                let counter = 0;

                cluster.task(async ({ page, data: url }) => {
                    counter += 1;
                });
                cluster.queue(TEST_URL);
                cluster.queue(TEST_URL);

                expect(counter).toBe(0);
                await cluster.waitForOne();
                expect(counter).toBe(1);
                await cluster.waitForOne();
                expect(counter).toBe(2);

                await cluster.idle();
                await cluster.close();
            });

            test('retryDelay = 0', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    retryLimit: 1,
                    retryDelay: 0,
                });

                const ERROR_URL = 'http://example.com/we-are-never-visited-the-page';

                cluster.task(async ({ page, data: url }) => {
                    if (url === ERROR_URL) {
                        throw new Error('testing retryDelay');
                    }
                });

                jest.useFakeTimers();
                cluster.queue(ERROR_URL);

                const url1 = await cluster.waitForOne();
                expect(url1).toBe(ERROR_URL);

                jest.advanceTimersByTime(10000);
                cluster.queue(TEST_URL);

                const url2 = await cluster.waitForOne();
                expect(url2).toBe(ERROR_URL);

                jest.advanceTimersByTime(100000);
                const url3 = await cluster.waitForOne();
                expect(url3).toBe(TEST_URL);

                await cluster.close();

                jest.useRealTimers();
            });

            test('retryDelay > 0', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    retryLimit: 1,
                    retryDelay: 100000,
                });

                const ERROR_URL = 'http://example.com/we-are-never-visited-the-page';

                cluster.task(async ({ page, data: url }) => {
                    if (url === ERROR_URL) {
                        throw new Error('testing retryDelay');
                    }
                });

                jest.useFakeTimers();
                cluster.queue(ERROR_URL);

                const url1 = await cluster.waitForOne();
                expect(url1).toBe(ERROR_URL);

                // forward, but no jobs sould be executed
                jest.advanceTimersByTime(10000);
                cluster.queue(TEST_URL);

                const url2 = await cluster.waitForOne();
                expect(url2).toBe(TEST_URL);

                jest.advanceTimersByTime(100000);
                const url3 = await cluster.waitForOne();
                expect(url3).toBe(ERROR_URL);

                await cluster.close();

                jest.useRealTimers();
            });

            test('sameDomainDelay = 0', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    sameDomainDelay: 0,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                let counter = 0;

                const FIRST_URL = 'http://example.com/we-are-never-visiting-the-page';
                const SECOND_URL = 'http://another.tld/we-are-never-visiting-the-page';

                await cluster.task(async ({ page, data: { url, counterShouldBe } }) => {
                    counter += 1;
                    expect(counter).toBe(counterShouldBe);
                });

                await cluster.queue({ url: FIRST_URL, counterShouldBe: 1 });
                await cluster.queue({ url: FIRST_URL, counterShouldBe: 2 });
                await cluster.waitForOne();
                await cluster.queue({ url: SECOND_URL, counterShouldBe: 3 });
                await cluster.queue({ url: SECOND_URL, counterShouldBe: 4 });
                await cluster.waitForOne();
                await cluster.queue({ url: TEST_URL, counterShouldBe: 5 });

                await cluster.idle();
                await cluster.close();
            });

            test('sameDomainDelay != 0', async () => {
                jest.useRealTimers();
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    sameDomainDelay: 1000,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                let counter = 0;

                const FIRST_URL = 'http://example.com/we-are-never-visiting-the-page';
                const SECOND_URL = 'http://another.tld/we-are-never-visiting-the-page';

                await cluster.task(async ({ page, data: { url, counterShouldBe } }) => {
                    counter += 1;
                    expect(counter).toBe(counterShouldBe);
                });

                await cluster.queue({ url: FIRST_URL, counterShouldBe: 1 });
                await cluster.queue({ url: FIRST_URL, counterShouldBe: 4 });
                await cluster.waitForOne();
                await cluster.queue({ url: SECOND_URL, counterShouldBe: 2 });
                await cluster.queue({ url: SECOND_URL, counterShouldBe: 5 });
                await cluster.waitForOne();
                await cluster.queue({ url: TEST_URL, counterShouldBe: 3 });

                await cluster.idle();
                await cluster.close();
            });

            test('sameDomainDelay with multiple workers', async () => {
                jest.useRealTimers();

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 2,
                    sameDomainDelay: 1000,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                let counter = 0;

                const FIRST_URL = 'http://example.com/we-are-never-visiting-the-page';
                const SECOND_URL = 'http://another.tld/we-are-never-visiting-the-page';

                await cluster.task(async ({ page, data: { url, counterShouldBe } }) => {
                    counter += 1;
                    expect(counter).toBe(counterShouldBe);
                });

                await cluster.queue({ url: FIRST_URL, counterShouldBe: 1 });
                await cluster.queue({ url: FIRST_URL, counterShouldBe: 4 });
                await cluster.waitForOne();
                await cluster.queue({ url: SECOND_URL, counterShouldBe: 2 });
                await cluster.queue({ url: SECOND_URL, counterShouldBe: 5 });
                await cluster.waitForOne();
                await cluster.queue({ url: TEST_URL, counterShouldBe: 3 });

                await cluster.idle();
                await cluster.close();
            });

            test('works with only functions', async () => {
                expect.assertions(4);

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                await cluster.queue(async ({ page, data }) => {
                    expect(page).toBeDefined();
                    expect(data).toBeUndefined();
                });

                await cluster.queue('something', async ({ page, data: url }) => {
                    expect(page).toBeDefined();
                    expect(url).toBe('something');
                });

                await cluster.idle();
                await cluster.close();
            });

            test('works with a mix of task functions', async () => {
                expect.assertions(8);

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                await cluster.task(async ({ page, data: url }) => {
                    // called two times
                    expect(page).toBeDefined();
                    expect(url).toBe('works');
                });

                await cluster.queue('works too', async ({ page, data: url }) => {
                    expect(page).toBeDefined();
                    expect(url).toBe('works too');
                });
                cluster.queue('works');
                await cluster.queue(async ({ page, data: url }) => {
                    expect(page).toBeDefined();
                    expect(url).toBeUndefined();
                });
                cluster.queue('works');

                await cluster.idle();
                await cluster.close();
            });

            test('works with complex objects', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                await cluster.task(async ({ page, data }) => {
                    expect(data.a.b).toBe('test');
                });
                cluster.queue({ a: { b: 'test' } });

                await cluster.idle();
                await cluster.close();
            });

            // TODO test('throws when no task function given');
        });
    });
});
