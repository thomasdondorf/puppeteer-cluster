// You need a Top 1M list in this directory as top-1m.csv (rank,domain per line).
// The Alexa list this example was written for is gone; the NetAPI Top 1M is a
// free replacement in the same format (drop its header line):
//   curl -s https://netapi.com/netapi_top1mln.csv | tail -n +2 > top-1m.csv

const { Cluster } = require('../dist');

const fs = require('fs').promises;

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
        monitor: true,
    });

    // Extracts document.title of the crawled pages
    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title of ${url} is ${pageTitle}`);
    });

    // In case of problems, log them
    cluster.on('taskerror', (err, data) => {
        console.log(`  Error crawling ${data}: ${err.message}`);
    });

    // Read the top-1m.csv file from the current directory
    const csvFile = await fs.readFile(__dirname + '/top-1m.csv', 'utf8');
    const lines = csvFile.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const splitterIndex = line.indexOf(',');
        if (splitterIndex !== -1) {
            const domain = line.substr(splitterIndex + 1);
            // queue the domain
            cluster.queue('http://www.' + domain);
        }
    }

    await cluster.idle();
    await cluster.close();
})();
