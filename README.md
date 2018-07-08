# Puppeteer Cluster

[![Build Status](https://api.travis-ci.org/thomasdondorf/puppeteer-cluster.svg?branch=master)](https://travis-ci.org/thomasdondorf/puppeteer-cluster)
[![npm](https://img.shields.io/npm/v/puppeteer-cluster.svg)](https://www.npmjs.com/package/puppeteer-cluster)
[![Coverage Status](https://coveralls.io/repos/github/thomasdondorf/puppeteer-cluster/badge.svg?branch=master)](https://coveralls.io/github/thomasdondorf/puppeteer-cluster?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/thomasdondorf/puppeteer-cluster/badge.svg)](https://snyk.io/test/github/thomasdondorf/puppeteer-cluster)

Create a cluster of puppeteer workers. This library spawns a pool of Chromium instances via [Puppeteer] and helps to keep track of jobs and errors. This is hepful if you want to crawl multiple pages or run tests in parallel. Puppeteer Cluster takes care of reusing Chromium and restarting the browser in case of errors.

###### What does this library do?

* Handling of crawling errors
* Auto restarts the browser in case of a crash
* Can automatically retry if a job fails
* Different concurrency models to choose from (pages, contexts, browsers)
* Simple to use, small boilerplate
* Progress view and monitoring statistics (see below)

<p align="center">
  <img src="https://i.imgur.com/koGNkBN.gif" height="250">
</p>

## Install

Install puppeteer:

`npm install --save puppeteer`

Install puppeteer-cluster:

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
* [Simple example](examples/minimal.js)
* [Deep crawling the Google search results](examples/deep-google-crawler.js)
* [Crawling the Alexa Top 1 Million](examples/alexa-1m.js)
* [Queuing functions (simple)](examples/function-queuing-simple.js)
* [Queuing functions (complex)](examples/function-queuing-complex.js)

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
  - `maxConcurrency` <[number]> Maximal number of parallel workers. Defaults to `1`.
  - `puppeteerOptions` <[Object]> Object passed to [puppeteer.launch]. See puppeteer documentation for more information. Defaults to `{}`.
  - `retryLimit` <[number]> How often do you want to retry a job before marking it as failed. Defaults to `0`.
  - `retryDelay` <[number]> How much time should pass at minimum between the job execution and its retry. Defaults to `0`.
  - `sameDomainDelay` <[number]> How much time should pass at minimum between two requests to the same domain.
  - `skipDuplicateUrls` <[boolean]> If set to `true`, will skip URLs which were already crawled by the cluster. Defaults to `false`.
  - `timeout` <[number]> Specify a timeout for all tasks. Can be overridden by [Cluster.task] and [Cluster.queue] options. Defaults to `30000` (30 seconds).
  - `monitor` <[boolean]> If set to `true`, will provide a small command line output to provide information about the crawling process. Defaults to `false`.
  - `workerCreationDelay` <[number]> Time between creation of two workers. Set this to a value like `100` (0.1 seconds) in case you want some time to pass before another worker is created. You can use this to prevent a network peak right at the start. Defaults to `0` (no delay).
- returns: <[Promise]<[Cluster]>>

The method launches a cluster instance.

#### Cluster.task(taskFunction)
- `taskFunction` <[function]([string]|[Object], [Page], [Object])> Sets the function, which will be called for each job. The function will be called with three arguments (given below):
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `url` <[string]|[Object]> The data of the job you provided to [Cluster.queue]. This can either be a URL or an object containing additional data (including the URL). See [examples](examples/) for a more complex usage of the argument.
  - `information` <[Object]> An object containing additional information about your taks.
    - `worker` <[Object]> The worker executing the current job.
      - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Specifies a task for the cluster. A task is called for each job you queue via [Cluster.queue]. Alternatively you can directly queue the function that you want to be executed. See [Cluster.queue] for an example.

#### Cluster.queue([urlOrData,] [taskFunction])
- `urlOrData` <[string]|[Object]> URL to be called or alternatively an object containing information. The string or object will be provided to your task function(s). See [examples] for a more complex usage of this argument.
- `taskFunction` <[function]> Function like the one given to [Cluster.task]. If a function is provided, this function will be called (only for this job) instead of the function provided to [Cluster.task].
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `url` <[string]|[Object]> The data of the job you provided as first argument to [Cluster.queue]. This might be `undefined` in case you only specified a function.
  - `information` <[Object]> An object containing additional information about your taks.
    - `worker` <[Object]> The worker executing the current job.
      - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Puts a URL or data into the queue. Alternatively (or even additionally) you can queue functions to be executed. See the examples about function queuing for more information: ([Simple function queuing](examples/function-queuing-simple.js), [complex function queuing](examples/function-queuing-complex.js))

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
