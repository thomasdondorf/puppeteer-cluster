const { Cluster } = require('../dist');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    // We don't define a task and instead queue individual functions

    // Make a screenshot
    cluster.queue(async ({ page }) => {
        await page.goto('http://www.wikipedia.org');
        await page.screenshot({path: 'wikipedia.png'});
    });

    // Extract a title
    cluster.queue(async ({ page }) => {
        await page.goto('https://www.google.com/');
        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title is ${pageTitle}`);
    });


    // And do more stuff...
    cluster.queue(async ({ page }) => {
        await page.goto('https://www.google.com/');
        // ...
    });

    await cluster.idle();
    await cluster.close();
})();