const Cluster = require('../lib/Cluster');

(async () => {
    const cluster = await Cluster.launch();

    await cluster.task(async ({ page, cluster, context }) => {
        await page.goto('https://example.com');
        await page.screenshot({path: 'example.png'});
    });

    // cluster.queue(['http://www.google.com/', 'http://www.example.com/']);
})();