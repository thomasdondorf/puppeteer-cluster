const { Cluster } = require('../dist');

(async () => {
    // Create a cluster with 2 workers
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    // Define a task
    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url);
        const pageTitle = await page.evaluate(() => document.title);
        return pageTitle;
    });

    // Use try-catch block as "execute" will throw instead of using events
    try {
        // Execute the tasks one after another via execute
        const result1 = await cluster.execute('https://www.google.com');
        console.log(result1);
        const result2 = await cluster.execute('https://www.wikipedia.org');
        console.log(result2);
    } catch (err) {
        // Handle crawling error
    }

    // Shutdown after everything is done
    await cluster.idle();
    await cluster.close();
})();