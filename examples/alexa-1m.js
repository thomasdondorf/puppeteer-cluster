const { Cluster } = require('../build');

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const cluster = await Cluster.launch({
        monitor: true,
        maxConcurrency: 2,
        concurrency: Cluster.CONCURRENCY_CONTEXT,
    });

    await cluster.setTask(async ({ url, page, cluster, context }) => {
        await page.goto(url);
        // ...
    });

    const csvFile = await readFile(__dirname + '/../data/top-1m.csv', 'utf8');
    const lines = csvFile.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const splitterIndex = line.indexOf(',');
        if (splitterIndex !== -1) {
            const url = line.substr(splitterIndex + 1);
            cluster.queue('http://www.' + url);
        }
    }

    await cluster.idle();
    await cluster.close();

})();