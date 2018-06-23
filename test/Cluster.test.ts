import Cluster from '../src/Cluster';
import * as http from 'http';

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
            url: 'http://127.0.0.1:3001',
        });
    });

    // one job sets the cookie, the other page reads the cookie
    cluster.queue('http://127.0.0.1:3001/');
    cluster.queue('http://127.0.0.1:3001/');

    await cluster.idle();
    await cluster.close();
}

describe('options', () => {

    let testServer;

    beforeAll(async () => {
        // test server
        await new Promise((resolve) => {
            testServer = http.createServer((req, res) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end('<html><body>puppeteer-cluster TEST</body></html>');
            }).listen(3001, '127.0.0.1', resolve);
        });
    });

    afterAll(() => {
        testServer.close();
    });

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

        const sameUrl = 'http://127.0.0.1:3001/';

        const cluster = await Cluster.launch({
            maxConcurrency: 1,
            skipDuplicateUrls: true,
        });

        cluster.task(async (url) => {
            expect(url).toBe(sameUrl);
        });

        cluster.queue(sameUrl);
        cluster.queue(sameUrl);

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
});
