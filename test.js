require('dotenv').config()
const uuid = require('uuid');
const { Cluster } = require('./dist/index.js');
const fs = require('fs');
(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 2,

        monitor: true,
        puppeteerOptions: {
            headless: false
        }
    });

    cluster.on('taskerror', (err, data) => {
        //console.log(err)
        console.log(`Error crawling ${data}: ${err.message}`);
    });
    await cluster.task(async ({ page, data }) => {
        //console.log(process.env.REDIS_KEY_PATTERN)
        await page.goto(data.url);
        await page.waitForTimeout(5000)
        const screen = await page.pdf();
        //console.log('concluido: ' + data.uuid)

        fs.writeFileSync('screen.pdf', screen);
        // Store screenshot, do something else
    });

    var uuidGenerated = uuid.v4()
    //cluster.queue({ uuid: uuidGenerated, url: 'http://www.google.com/' },);
    for (var i = 0; i < 100; i++) {
        uuidGenerated = uuid.v4()
        cluster.queue({ uuid: uuidGenerated, url: 'http://www.google.com/' });
        /*uuidGenerated = uuid.v4()
        cluster.queue({ uuid: uuidGenerated, url: 'http://www.google.com/' });
        uuidGenerated = uuid.v4()
        cluster.queue({ uuid: uuidGenerated, url: 'http://www.google.com/' });*/
    }
    // many more pages

    await cluster.idle();
    await cluster.close();
})();