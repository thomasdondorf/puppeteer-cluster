const { Cluster } = require('../dist');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 40,
        maxCPU: 80,
        maxMemory: 50,
        workerCreationDelay: 4000,
        monitor: true,
    });

    await cluster.task(async (url, page) => {
        await page.goto(url);

        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title of ${url} is ${pageTitle}`);
    });

    cluster.queue('http://www.google.com');
    cluster.queue('http://www.wikipedia.org');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('http://www.google.com');
    cluster.queue('http://www.wikipedia.org');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('http://www.google.com');
    cluster.queue('http://www.wikipedia.org');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('http://www.google.com');
    cluster.queue('http://www.wikipedia.org');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('http://www.google.com');
    cluster.queue('http://www.wikipedia.org');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');

    await cluster.idle();
    await cluster.close();

})();