const Cluster = require('../lib/Cluster');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const cluster = await Cluster.launch({
        maxWorker: 2,
        concurrency: Cluster.CONCURRENCY_PAGE,
        // monitor: true,
    });

    await cluster.setTask(async ({ url, page, cluster, worker, context }) => {
        console.log('going to: ' + url);
        await page.goto(url);
        // await sleep(3000);
        await page.screenshot({path: 'data/test123.png'});
        console.log('DONE');
    });

    cluster.queue('http://www.google.com');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');

    await cluster.idle();
    await cluster.close();

})();