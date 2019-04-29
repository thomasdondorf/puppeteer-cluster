// You need to download the Alexa 1M from http://s3.amazonaws.com/alexa-static/top-1m.csv.zip
// and unzip it into this directory

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
