# Puppeteer Cluster

Create a cluster of puppeteer workers. This library spawns a pool of Chromium instances via [Puppeteer] and helps to keep track of jobs and errors. This is hepful if you want to crawl multiple pages or run tests in parallel. Puppeteer Cluster takes care of reusing Chromium and restarting the browser in case of errors.

###### What does this library do?

* Handling of crawling errors
* Auto restarts the browser in case of a crash
* Can automatically retry if a job fails
* Different concurrency models to choose from (pages, contexts, browsers)
* Simple to use, small boilerplate
* Progress view and monitoring statistics

## Install

Install puppeteer:

`npm install --save puppeteer`

Install puppeteer-cluster (currently tested with Node.js versions >= 8.10):

`npm install --save puppeteer-cluster`

## Usage

The following is a typical example of using puppeteer-cluster. A cluster is created with 2 concurrent workers. Then a task is defined which includes going to the URL and taking a screenshot. We then queue two jobs and wait for the cluster to finish.

```js
const { Cluster } = require('puppeteer-cluster');

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  cluster.task(async (page, url) => {
    await page.goto(url);
    const screen = await page.screenshot();
    // Store screenshot, do something else
  });

  await cluster.queue('http://www.google.com/');
  await cluster.queue('http://www.wikipedia.org/');
  // many more pages

  await cluster.idle();
  await cluster.close();
})();
```

## Examples
* Minimal example
* TODO Improve Google crawl example
* Crawling the Alexa Top 1 Million
* Crawl Wikipedia until some depth is reached
* TODO Queuing of functions

## Concurreny models

There are different concurrency models, which define how isolated each job is run. You can set it in the `options` when calling [Cluster.launch](#Clusterlaunchoptions). The default option is `Cluster.CONCURRENCY_CONTEXT`, but it is recommended to always specify which one you want to use.

| Concurrency | Description | Shared data |
| --- | --- | --- |
| `CONCURRENCY_PAGE` | One [Page] for each URL | Shares everything (cookies, localStorage, etc.) between jobs. |
| `CONCURRENCY_CONTEXT` | Incognito page (see [IncognitoBrowserContext](https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#browsercreateincognitobrowsercontext)) for each URL  | No shared data. |
| `CONCURRENCY_BROWSER` | One browser (using an incognito page) per URL. If one browser instance crashes for any reason, this will not affect other jobs. | No shared data.  |

## API

### class: Cluster

Cluster module provides a method to launch a cluster of Chromium instances.

#### event: 'taskerror'
- <[Error]>
- <[string]|[Object]>

Emitted when the task ends in an error for some reason. Reasons might be a network error, your code throwing an error, timeout hit, etc. The first argument will the error itself. The second argument is the URL or data of the job (as given to [Cluster.queue]). If retryLimit is set to a value greater than `0`, the cluster will automatically requeue the job and retry it again later.

```js
  cluster.on('taskerror', (err, url) => {
      console.log(`Error crawling ${url}: ${err.message}`);
  });
```

#### Cluster.launch(options)
- `options` <[Object]> Set of configurable options for the cluster. Can have the following fields:
  - `concurrency` <*Cluster.CONCURRENCY_PAGE*|*Cluster.CONCURRENCY_CONTEXT*|*Cluster.CONCURRENCY_BROWSER*> The choosen concurrency model. See [Concurreny models](#concurreny-models) for more information. Defaults to `Cluster.CONCURRENCY_CONTEXT`.
  - `maxConcurrency` <[number]> Maximal number of parallel workers. Set to `0` to deactivate (in case you want to rely only on maxCPU and/or maxMemory). Defaults to `1`.
  - `puppeteerOptions` <[Object]> Object passed to [puppeteer.launch]. See puppeteer documentation for more information. Defaults to `{}`.
  - `retryLimit` <[number]> How often do you want to retry a job before marking it as failed. Defaults to `0`.
  - `retryDelay` <[number]> How much time should pass at minimum between the job execution and its retry. Defaults to `0`.
  - `sameDomainDelay` <[number]> How much time should pass at minimum between two requests to the same domain.
  - `skipDuplicateUrls` <[boolean]> If set to `true`, will skip URLs which were already crawled by the cluster. Defaults to `false`.
  - `timeout` <[number]> Specify a timeout for all tasks. Can be overridden by [Cluster.task] and [Cluster.queue] options. Defaults to `30000` (30 seconds).
  - `monitor` <[boolean]> If set to `true`, will provide a small command line output to provide information about the crawling process. See TODO screenshot. Defaults to `false`.
  - `maxCPU` <[number]> (*experimental*) Maximal usage of CPU in percentage to allow spawning of more workers. `50` means spawn workers until 50% CPU load is detected. Set to `0` to deactivate. Defaults to `0`.
  - `maxMemory` <[number]> (*experimental*) Maximal usage of memory in percentage to allow spawning of more workers. `50` means spawn workers until 50% of available memory is used. Set to `0` to deactivate. Defaults to `0`.
  - `workerCreationDelay` (*experimental*) <[number]> Time between creation of two workers. Set this to something like `1000` (one second) in case you use `maxCPU` or `maxMemory`. This makes sure not all workers are created at the same time as you want to wait some time before CPU or memory is checked again. Defaults to `0`.
- returns: <[Promise]<[Cluster]>>

The method launches a cluster instance.

#### Cluster.task(taskFunction)
- `taskFunction` <[function]([string]|[Object], [Page], [Object])> Sets the function, which will be called for each job. The function will be called with three arguments (given below):
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `url` <[string]|[Object]> The data of the job you provided to [Cluster.queue]. This can either be a URL or an object containing additional data (including the URL). See example TODO for a more complex usage of the argument.
  - `information` <[Object]> An object containing additional information about your taks.
    - `worker` <[Object]> The worker executing the current job.
      - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Specifies a task for the cluster. A task is called for each job you queue via [Cluster.queue]. Alternatively you can directly queue the function that you want to be executed. See [Cluster.queue] for an example.

#### Cluster.queue([urlOrData,] [taskFunction])
- `urlOrData` <[string]|[Object]> URL to be called or alternatively an object containing information. The string or object will be provided to your task function(s). See example TODO for a more complex usage of this argument.
- `taskFunction` <[function]> Function like the one given to [Cluster.task]. If a function is provided, this function will be called (only for this job) instead of the function provided to [Cluster.task].
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `url` <[string]|[Object]> The data of the job you provided as first argument to [Cluster.queue]. This might be `undefined` in case you only specified a function.
  - `information` <[Object]> An object containing additional information about your taks.
    - `worker` <[Object]> The worker executing the current job.
      - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Puts a URL (a job) into the queue. TODO add examples for all possible calls

#### Cluster.idle()
- returns: <[Promise]>

Promise is resolved when the queue becomes empty.

#### Cluster.close()
- returns: <[Promise]>

Closes the cluster and all opened Chromium instances including all open pages (if any were opened). It is recommended to run [Cluster.idle](#clusteridle) before calling this function. The [Cluster] object itself is considered to be disposed and cannot be used anymore.



[Cluster.queue]: #clusterqueueurlordata-taskfunction "Cluster.queue"
[Cluster.task]: #clustertasktaskfunction "Cluster.task"
[Cluster]: #class-cluster "Cluster"

[Puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
[Page]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-page "Page"
[puppeteer.launch]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#puppeteerlaunchoptions "puppeteer.launch"

[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Error]: https://nodejs.org/api/errors.html#errors_class_error "Error"
