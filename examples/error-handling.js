// This example explains the error handling
// Console output of the script will be:
// > Error crawling https://www.wikipedia.org/: Fake error
// > Error crawling https://domain.invalid/: net::ERR_NAME_NOT_RESOLVED at https://domain.invalid/

const { Cluster } = require('../dist');

(async () => {
    // Create a cluster with 2 workers
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    // Event handler to be called in case of problems
    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(async ({ page, data: url }) => {
        // Simulate an error for Wikipedia
        if (url === 'https://www.wikipedia.org/') {
            throw new Error('Fake error');
        }

        await page.goto(url, { waitUntil: 'domcontentloaded' });
        // ...
    });

    cluster.queue('https://www.google.com/');
    cluster.queue('https://www.wikipedia.org/'); // error (see task function)
    cluster.queue('https://github.com/');

    cluster.queue('https://domain.invalid/'); // error: ERR_NAME_NOT_RESOLVED

    await cluster.idle();
    await cluster.close();
})();