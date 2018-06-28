// You need to download the Alexa 1M from http://s3.amazonaws.com/alexa-static/top-1m.csv.zip
// and unzip it into the data directory

const { Cluster } = require('../dist');

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
        monitor: true,
    });

    await cluster.task(async (page, url) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title of ${url} is ${pageTitle}`);
    });

    cluster.on('taskerror', (err, url) => {
        console.log(`  Error crawling ${url}: ${err.message}`);
    });

    const csvFile = await readFile(__dirname + '/../data/top-1m.csv', 'utf8');
    const lines = csvFile.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const splitterIndex = line.indexOf(',');
        if (splitterIndex !== -1) {
            const url = line.substr(splitterIndex + 1);
            await cluster.queue('http://www.' + url);
        }
    }

    await cluster.idle();
    await cluster.close();
})();