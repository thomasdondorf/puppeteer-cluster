const { Cluster } = require('../dist');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    await cluster.task(async (page, url) => {
        await page.goto(url);

        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title of ${url} is ${pageTitle}`);
    });

    await cluster.queue('http://www.google.com');
    await cluster.queue('http://www.wikipedia.org');
    await cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');

    // You can also queue functions
    await cluster.queue(async (page) => {
        await page.goto('https://www.npmjs.com/package/puppeteer-cluster');
        // get the version from the npm, yes I know there is an API for that...
        const version = await page.evaluate(() => {
            const h3s = document.querySelectorAll('h3');
            for (let i = 0; i < h3s.length; i += 1) {
                if (h3s[i].innerText === 'version') {
                    return h3s[i].nextSibling.innerText;
                }
            }
            return 'Unknown';
        })
        console.log(`puppeteer-cluster is currently at version: ${version}`);
    });

    await cluster.idle();
    await cluster.close();
})();