import Cluster from '../src/Cluster';
import * as http from 'http';
import {timeoutExecute} from '../src/util';
import * as puppeteer from 'puppeteer';
import * as puppeteerCore from 'puppeteer-core';
import ConcurrencyImplementation from '../src/concurrency/ConcurrencyImplementation';
import Browser from '../src/concurrency/built-in/Browser';

const kill = require('tree-kill');

let testServer: http.Server;

const TEST_URL = 'http://127.0.0.1:3001/';

const concurrencyTypes = [
    Cluster.CONCURRENCY_PAGE,
    Cluster.CONCURRENCY_CONTEXT,
    Cluster.CONCURRENCY_BROWSER,
];

beforeAll(async () => {
    // test server
    await new Promise<void>((resolve) => {
        testServer = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body>puppeteer-cluster TEST</body></html>');
        }).listen(3001, '127.0.0.1', resolve);
    });
});

afterAll(() => {
    testServer.close();
});

describe('options', () => {

    async function cookieTest(concurrencyType: number) {
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

    concurrencyTypes.forEach((concurrency) => {
        describe(`concurrency: ${concurrency}`, () => {

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
                expect.assertions(2);
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

                cluster.queue(ERROR_URL);

                const url1 = await cluster.waitForOne();
                expect(url1).toBe(ERROR_URL);

                await timeoutExecute(1000, (async () => {
                    const url2 = await cluster.waitForOne();
                    expect(url2).toBe(ERROR_URL);
                })());

                await cluster.close();
            });

            test('retryDelay > 0', async () => {
                expect.assertions(3);

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                    retryLimit: 1,
                    retryDelay: 250,
                });

                const ERROR_URL = 'http://example.com/we-are-never-visited-the-page';

                cluster.task(async ({ page, data: url }) => {
                    if (url === ERROR_URL) {
                        throw new Error('testing retryDelay');
                    }
                });

                cluster.queue(ERROR_URL);

                const url1 = await cluster.waitForOne();
                expect(url1).toBe(ERROR_URL);

                try {
                    await timeoutExecute(200, (async () => {
                        await cluster.waitForOne(); // should time out!
                    })());
                } catch (err: any) {
                    expect(err.message).toMatch(/Timeout/);
                }

                const url2 = await cluster.waitForOne();
                expect(url2).toBe(ERROR_URL);

                await cluster.close();
            });

            test('sameDomainDelay with one worker', async () => {
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

                cluster.queue({ url: FIRST_URL, counterShouldBe: 1 });
                cluster.queue({ url: FIRST_URL, counterShouldBe: 3 });
                await cluster.waitForOne();
                cluster.queue({ url: SECOND_URL, counterShouldBe: 2 });

                await cluster.idle();
                await cluster.close();
            });

            test('sameDomainDelay with multiple workers', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 2,
                    sameDomainDelay: 5000,
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

                cluster.queue({ url: FIRST_URL, counterShouldBe: 1 });
                cluster.queue({ url: FIRST_URL, counterShouldBe: 3 });
                await cluster.waitForOne();
                cluster.queue({ url: SECOND_URL, counterShouldBe: 2 });

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

                cluster.queue(async ({ page, data }: { page: any, data: any}) => {
                    expect(page).toBeDefined();
                    expect(data).toBeUndefined();
                });

                cluster.queue('something', async ({ page, data: url }) => {
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

                cluster.queue('works too', async ({ page, data: url }) => {
                    expect(page).toBeDefined();
                    expect(url).toBe('works too');
                });
                cluster.queue('works');
                cluster.queue(async ({ page, data }: { page: any, data: any}) => {
                    expect(page).toBeDefined();
                    expect(data).toBeUndefined();
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

            test('works with null', async () => {
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                await cluster.task(async ({ page, data }) => {
                    expect(data).toBe(null);
                });
                cluster.queue(null);

                await cluster.idle();
                await cluster.close();
            });

            test('execute', async () => {
                expect.assertions(2);
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 2,
                });
                cluster.on('taskerror', (err) => {
                    // should never throw as errors are given directly to await try-catch block
                    throw err;
                });

                await cluster.task(async ({ page, data }) => {
                    return data;
                });
                const value1 = await cluster.execute(1);
                const value2 = await cluster.execute('something');
                expect(value1).toBe(1);
                expect(value2).toBe('something');

                await cluster.idle();
                await cluster.close();
            });

            test('execute a function', async () => {
                expect.assertions(2);
                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 2,
                });
                cluster.on('taskerror', (err) => {
                    // should never throw as errors are given directly to await try-catch block
                    throw err;
                });

                const value1 = await cluster.execute(async () => {
                    return 'some value';
                });
                expect(value1).toBe('some value');
                const value2 = await cluster.execute('world', async ({ data }) => {
                    return `hello ${data}`;
                });
                expect(value2).toBe('hello world');

                await cluster.idle();
                await cluster.close();
            });

            test('execute/queue errors', async () => {
                expect.assertions(2);

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    // queue is catched in here
                    expect(err.message).toBe('queued');
                });

                await cluster.task(async ({ page, data }) => {
                    await new Promise(resolve => setTimeout(resolve, 0)); // make sure its async
                    throw new Error(data);
                });
                try {
                    const value1 = await cluster.execute('executed');
                    expect(1).toBe(2); // fail, should never reach this point
                } catch (e: any) {
                    // execute is catched in here
                    expect(e.message).toBe('executed');
                }
                cluster.queue('queued');

                await cluster.idle();
                await cluster.close();
            });

            test('event: queue', async () => {
                expect.assertions(12);

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                const func2 = async () => {};
                const func3 = async () => {};

                let i = 0;
                cluster.on('queue', (data, func) => {
                    i += 1;
                    if (i === 1) {
                        expect(data).toBe('1');
                        expect(func).toBeUndefined();
                    } else if (i === 2) {
                        expect(data).toBeUndefined();
                        expect(func).toBe(func2);
                    } else if (i === 3) {
                        expect(data).toBe('3');
                        expect(func).toBe(func3);
                    } else if (i === 4) {
                        expect(data).toBe('4');
                        expect(func).toBeUndefined();
                    } else if (i === 5) {
                        expect(data).toBeUndefined();
                        expect(func).toBe(func2);
                    } else if (i === 6) {
                        expect(data).toBe('6');
                        expect(func).toBe(func3);
                    } else {
                        expect(2).toBe(1); // fail
                    }
                });

                await cluster.task(async ({ page, data }) => {
                    // ...
                });

                cluster.queue('1');
                cluster.queue(func2);
                cluster.queue('3', func3);

                await cluster.execute('4');
                await cluster.execute(func2);
                await cluster.execute('6', func3);

                await cluster.idle();
                await cluster.close();
            });

        });
    });
    // end of tests for all concurrency options

    test('other puppeteer objects like puppeteer-core', async () => {
        expect.assertions(2);

        const executablePath = (puppeteer as any).executablePath(); // TODO why does this not work anymore?
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_BROWSER,
            puppeteerOptions: {
                executablePath,
                args: ['--no-sandbox'],
            },
            maxConcurrency: 1,
            puppeteer: puppeteerCore,
        });
        cluster.on('taskerror', (err) => {
            throw err;
        });

        cluster.task(async ({ page, data: url }) => {
            await page.goto(url);
            // if we get here two times without any errors, we are fine
            expect(true).toBe(true);
        });

        // one job sets the cookie, the other page reads the cookie
        cluster.queue(TEST_URL);
        cluster.queue(TEST_URL);

        await cluster.idle();
        await cluster.close();
    });

    describe('custom concurrency implementations', () => {
        test('Test implementation', async () => {
            expect.assertions(2);

            class CustomConcurrency extends ConcurrencyImplementation {
                private browser: puppeteer.Browser | undefined = undefined;
                public async init() {
                    this.browser = await this.puppeteer.launch(this.options);
                }
                public async close() {
                    await (this.browser as puppeteer.Browser).close();
                }
                public async workerInstance() {
                    return {
                        jobInstance: async () => {
                            const page = await (this.browser as puppeteer.Browser).newPage();

                            // make sure this is really the page created by this implementation
                            (page as any).TESTING = 123;

                            return {
                                resources: { page },

                                close: async () => {
                                    await page.close();
                                },
                            };
                        },
                        close: async () => {
                            await (this.browser as puppeteer.Browser).close();
                        },

                        // no repair for this tests, but you should really implement this (!!!)
                        // have a look at Browser, Context or Page in built-in directory for a
                        // full implementation
                        repair: async () => {},
                    };
                }
                requestRestart(): void {
                }
            }

            const cluster = await Cluster.launch({
                concurrency: CustomConcurrency,
                puppeteerOptions: { args: ['--no-sandbox'] },
                maxConcurrency: 1,
            });
            cluster.on('taskerror', (err) => {
                throw err;
            });

            cluster.task(async ({ page, data: url }) => {
                await page.goto(url);
                expect((page as any).TESTING).toBe(123);
            });

            // one job sets the cookie, the other page reads the cookie
            cluster.queue(TEST_URL);
            cluster.queue(TEST_URL);

            await cluster.idle();
            await cluster.close();
        });
        test('Reuse existing implementation', async () => {
            expect.assertions(2);

            const cluster = await Cluster.launch({
                concurrency: Browser, // use one of the existing implementations
                puppeteerOptions: { args: ['--no-sandbox'] },
                maxConcurrency: 1,
            });
            cluster.on('taskerror', (err) => {
                throw err;
            });

            cluster.task(async ({ page, data: url }) => {
                await page.goto(url);
                expect(true).toBe(true);
            });

            // one job sets the cookie, the other page reads the cookie
            cluster.queue(TEST_URL);
            cluster.queue(TEST_URL);

            await cluster.idle();
            await cluster.close();
        });
    });

    describe('perBrowserOptions', () => {
        test('Throw when maxConcurrency not equal perBrowserOptions length', async () => {
            expect.assertions(1);
            await expect(Cluster.launch({
                concurrency: Cluster.CONCURRENCY_BROWSER,
                perBrowserOptions: [{ args: ['--no-sandbox'] }],
                maxConcurrency: 5,
            })).rejects.toHaveProperty('message', 'perBrowserOptions length must equal maxConcurrency');
        });
        test('Dispatch option accross worker', async () => {
            expect.assertions(3);

            const perBrowserOptions = [
                { args: ['--test1'] },
            ];
            class TestConcurrency extends ConcurrencyImplementation {
                private browser: puppeteer.Browser | undefined = undefined;
                public async init() {
                    this.browser = await this.puppeteer.launch(this.options);
                }
                public async close() {
                    await (this.browser as puppeteer.Browser).close();
                }
                public async workerInstance(puppeteerOptions: puppeteer.LaunchOptions) {
                    expect(puppeteerOptions).toBe(perBrowserOptions[0]);
                    return {
                        jobInstance: async () => {
                            const page = await (this.browser as puppeteer.Browser).newPage();

                            // make sure this is really the page created by this implementation
                            (page as any).TESTING = 123;

                            return {
                                resources: { page },

                                close: async () => {
                                    await page.close();
                                },
                            };
                        },
                        close: async () => {
                            await (this.browser as puppeteer.Browser).close();
                        },

                        // no repair for this tests, but you should really implement this (!!!)
                        // have a look at Browser, Context or Page in built-in directory for a
                        // full implementation
                        repair: async () => {},
                    };
                }
                
                requestRestart(): void {
                }
            }

            const cluster = await Cluster.launch({
                perBrowserOptions,
                concurrency: TestConcurrency,
                maxConcurrency: 1,
            });
            cluster.on('taskerror', (err) => {
                throw err;
            });

            cluster.task(async ({ page, data: url }) => {
                await page.goto(url);
                expect((page as any).TESTING).toBe(123);
            });

            // one job sets the cookie, the other page reads the cookie
            cluster.queue(TEST_URL);
            cluster.queue(TEST_URL);

            await cluster.idle();
            await cluster.close();
        });
    });

    describe('monitoring', () => {
        // setup and cleanup are copied from Display.test.ts
        let write: any;
        let log: any;
        let output = '';

        function cleanup() {
            process.stdout.write = write;
            console.log = log;
        }

        beforeEach(() => {
            output = '';
            write = process.stdout.write;
            log = console.log;

            (process.stdout.write as any) = (str: string) => {
                output += str;
            };

            console.log = (str) => {
                output += `${str}\n`;
            };
        });

        afterEach(cleanup);

        test('monitoring enabled', async () => {
            const cluster = await Cluster.launch({
                concurrency: Cluster.CONCURRENCY_CONTEXT,
                puppeteerOptions: { args: ['--no-sandbox'] },
                maxConcurrency: 1,
                monitor: true,
            });
            cluster.on('taskerror', (err) => {
                throw err;
            });

            cluster.task(async () => {
                await new Promise(resolve => setTimeout(resolve, 550));
            });

            cluster.queue(TEST_URL);

            // there should be at least one logging call in a 500ms interval
            output = '';
            await new Promise(resolve => setTimeout(resolve, 510));
            const numberOfLines = (output.match(/\n/g) || []).length;
            expect(numberOfLines).toBeGreaterThan(5);

            await cluster.idle();
            await cluster.close();
        });
    });

});

describe('Repair', () => {
    concurrencyTypes.forEach((concurrency) => {

        describe(`concurrency: ${concurrency}`, () => {
            test('Repair unexpected crash', async () => {

                const cluster = await Cluster.launch({
                    concurrency,
                    puppeteerOptions: { args: ['--no-sandbox'] },
                    maxConcurrency: 1,
                });
                cluster.on('taskerror', (err) => {
                    throw err;
                });

                // first job kills the browser
                cluster.queue(async ({ page }: { page: puppeteer.Page }) => {
                    // kill process
                    await new Promise((resolve) => {
                        kill(page.browser().process()!.pid, 'SIGKILL', resolve);
                    });

                    // check if its actually crashed
                    await expect(
                        page.goto(TEST_URL),
                    ).rejects.toMatchObject({
                        // error message of puppeteer disconnect
                        // before 1.9 -> error said "Protocol error"
                        // since 1.9 -> "Navigation failed because browser has disconnected!"
                        message: expect.stringMatching(/Protocol error|disconnected/),
                    });
                });

                // second one should still work after the crash
                cluster.queue(async ({ page }: { page: puppeteer.Page }) => {
                    await page.goto(TEST_URL); // if this does not throw, we are happy
                    expect(true).toBe(true);
                });

                await cluster.idle();
                await cluster.close();
            });
        });
    });
});
