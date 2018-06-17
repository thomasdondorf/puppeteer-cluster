const Cluster = require('../lib/Cluster');

(async () => {
    const cluster = await Cluster.launch({
        maxWorker: 2,
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        monitor: true,
    });

    await cluster.setTask(async ({ url, page, cluster, worker, context }) => {
        await page.goto(url);
        await page.screenshot({path: 'data/test123.png'});
    });

    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');

    await cluster.idle();
    await cluster.close();

})();