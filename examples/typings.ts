import { Cluster } from '../dist';

(async () => {
    /******************************* STRING -> NUMBER **********************/

    // Queued data is a string and task functions return a number
    const cluster1: Cluster<string, number> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 2,
    });

    await cluster1.task(async ({ page, data }) => {
        // ...
        const value = Math.random(); // somehow generate data
        return value;
    });

    // TypeScript now knows that data1 is a number
    const data1 = await cluster1.execute('https://www.google.com');

    await cluster1.idle();
    await cluster1.close();

    /******************************* STRING DATA **********************/

    // Queued data is a string
    const cluster2: Cluster<string> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 2,
    });

    await cluster2.task(async ({ page, data: url }) => {
        await page.goto(url);
    });

    cluster2.queue('https://www.google.com');
    cluster2.queue('https://www.wikipedia.org');
    cluster2.queue('https://github.com/');

    await cluster2.idle();
    await cluster2.close();

    /******************************* COMPLEX DATA **********************/

    interface SomeData {
        url: string;
        someValue: number;
    }

    const cluster3: Cluster<SomeData> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 2,
    });

    await cluster3.task(async ({ page, data }) => {
        await page.goto(data.url);
        console.log(`some value: ${data.someValue}`);
    });

    cluster3.queue({ url: 'https://www.google.com', someValue: 1 });
    cluster3.queue({ url: 'https://www.wikipedia.org', someValue: 2 });
    cluster3.queue({ url: 'https://github.com/', someValue: 3 });

    await cluster3.idle();
    await cluster3.close();
})();
