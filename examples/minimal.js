const Cluster = require('../lib/Cluster');

(async () => {
    const cluster = await Cluster.launch({
        maxWorker: 2,
    });

    await cluster.setTask(async ({ url, page, cluster, context }) => {
        console.log('going to: ' + url);

        await page.goto(url);
        await page.screenshot({path: 'test123.png'});
    });

    cluster.queue('https://www.google.com/');
    cluster.queue('https://example.com');
    cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md');
    cluster.queue('https://wikipedia.org');

    await cluster.idle();
    console.log('YUP');
    await cluster.close();

})();