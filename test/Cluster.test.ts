import Cluster from '../src/Cluster';
import * as http from 'http';

let testServer;

const TEST_URL = 'http://127.0.0.1:3001/'

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
        maxConcurrency: 1,
        concurrency: concurrencyType,
    });

    const randomValue = Math.random().toString();

    cluster.task(async (url: string, page) => {
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

    test('skipDuplicateUrls', async () => {
        expect.assertions(1);

        const cluster = await Cluster.launch({
            maxConcurrency: 1,
            skipDuplicateUrls: true,
        });

        cluster.task(async (url) => {
            expect(url).toBe(TEST_URL);
        });

        cluster.queue(TEST_URL);
        cluster.queue(TEST_URL);

        await cluster.idle();
        await cluster.close();
    });

    // TODO currently fails as they are processed in parallel
    /*test('skipDuplicateUrls (parallel)', async () => {
        expect.assertions(1);

        const sameUrl = 'http://www.google.com/';

        const cluster = await Cluster.launch({
            maxConcurrency: 2, // REASONE FOR FAILING!!
            skipDuplicateUrls: true,
        });

        cluster.task(async (url) => {
            expect(url).toBe(sameUrl);
        });

        cluster.queue(sameUrl);
        cluster.queue(sameUrl);

        await cluster.idle();
        await cluster.close();
    });*/

    test('retryLimit', async () => {
        expect.assertions(4); // 3 retries -> 4 times called

        const cluster = await Cluster.launch({
            maxConcurrency: 1,
            retryLimit: 3,
        });

        cluster.task(async (url) => {
            expect(true).toBe(true);
            throw new Error('testing retryLimit');
        });

        cluster.queue(TEST_URL);

        await cluster.idle();
        await cluster.close();
    });

    test('waitForOne', async () => {
        const cluster = await Cluster.launch({});
        let counter = 0;

        cluster.task(async (url) => {
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

    // TODO WIP
    /*test('retryDelay', async () => {
        jest.useFakeTimers();

        const cluster = await Cluster.launch({
            maxConcurrency: 1,
            retryLimit: 3,
            retryDelay: 100000,
        });

        let counter = 0;

        cluster.task(async (url) => {
            counter += 1;
            throw new Error('testing retryDelay');
        });

        cluster.queue(TEST_URL);

        await cluster.waitForOne();
        expect(counter).toBe(1);

        jest.advanceTimersByTime(1000);
        expect(counter).toBe(1);

        jest.runAllTimers();
        expect(counter).toBe(2);

        await cluster.idle();
        await cluster.close();

        jest.useRealTimers();
    });*/
});
