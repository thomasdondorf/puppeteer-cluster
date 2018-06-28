const { Cluster } = require('../dist');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    await cluster.task(async (page, { url, position }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        if (position === undefined) {
            (await page.evaluate(() => {
                // get search results from Google
                return [...document.querySelectorAll('#ires .g .rc > .r a')]
                    .map(el => ({ url: el.href, name: el.innerText }));
            })).forEach(({ url, name }, i) => {
                // Putting result into queue with a position infromation
                cluster.queue({
                    url,
                    position: (i+1)
                });
            });
        } else {
            // Page is a "result" page
            const pageTitle = await page.evaluate(() => document.title);
            console.log(`Page title of #${position} ${url} is ${pageTitle}`);
        }

    });

    await cluster.queue({ url: 'https://www.google.com/search?q=puppeteer-cluster' });

    await cluster.idle();
    await cluster.close();
})();