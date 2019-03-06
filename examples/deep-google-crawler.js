const { Cluster } = require('../dist');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    // Extract title of page
    const extractTitle = async ({ page, data }) => {
        const { url, position } = data;
        await page.goto(url);
        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title of #${position} ${url} is ${pageTitle}`);
    };

    // Crawl the Google page
    await cluster.task(async ({ page, data }) => {
        const { searchTerm, offset } = data;
        await page.goto(
            'https://www.google.com/search?q=' + searchTerm + '&start=' + offset,
            { waitUntil: 'domcontentloaded' }
        );

        console.log('Extracting Google results for offset=' + offset);

        // Extract the links and titles of the search result page
        (await page.evaluate(() => {
            return [...document.querySelectorAll('#ires .g .rc > .r a')]
                .map(el => ({ url: el.href, name: el.innerText }));
        })).forEach(({ url, name }, i) => {
            // Put them into the cluster queue with the task "extractTitle"
            console.log(`  Adding ${name} to queue`);
            cluster.queue({
                url,
                position: (offset + i+1)
            }, extractTitle);
        });
    });

    cluster.queue({ searchTerm: 'puppeteer-cluster', offset: 0 });
    cluster.queue({ searchTerm: 'puppeteer-cluster', offset: 10 });

    await cluster.idle();
    await cluster.close();
})();