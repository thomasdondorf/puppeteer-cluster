const { Cluster } = require('../build');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const cluster = await Cluster.launch({
        maxConcurrency: 2,
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        timeout: 10000,
        // skipDuplicateUrls: true,
        retryLimit: 1,
        retryDelay: 10000,
        // monitor: true,
    });

    await cluster.task(async (data, page, { worker }) => {
        let url = data.url;
        console.log('going to: ' + url);
        await page.goto(url);

        console.log('   got there ' + url);
        // await sleep(3000);
        await page.screenshot({path: 'data/test123.png'});
        console.log('       DONE ' + url);
    });

    cluster.queue({ url: 'http://www.google.com' });
    cluster.queue({ url: 'https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md?1' });
    cluster.queue({ url: 'https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md?2222'});
    //cluster.queue('https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md?333');

    await cluster.idle();
    await cluster.close();

})();