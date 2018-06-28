# Puppeteer Cluster

Create a cluster of puppeteer workers. This library spawns a pool of Chromium instances via [Puppeteer] and helps to keep track of jobs and errors. This is hepful if you want to crawl multiple pages or run tests in parallel. Puppeteer Cluster takes care of reusing Chromium, retrying in case of errors.

## Install

Install puppeteer (if you not already have it installed), with at least version 1.5.

`npm install --save puppeteer`

Install Puppeteer cluster

`npm install --save puppeteer-cluster`

Currently tested with node versions >= v8.10.0.

## Usage

The following is a typical example of using puppeteer-cluster. A cluster is created with 2 concurrent workers. Then a task is defined which includes going to the URL and taking a screenshot. We then wait for the cluster to idle and close it.

```js
const { Cluster } = require('puppeteer-cluster');

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  cluster.task(async (url, page) => {
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

### Concurreny models

There are different concurrency models, which define how isolated each job is run. You can set it in the `options` when calling [Cluster.launch](#Clusterlaunchoptions). The default option is `Cluster.CONCURRENCY_CONTEXT`, but it is recommended to always specify what model you want to use.

| Concurrency | Description | Shared data |
| --- | --- | --- |
| `CONCURRENCY_PAGE` | One [Page] for each URL | Shares everything (cookies, localStorage, etc.) between jobs. |
| `CONCURRENCY_CONTEXT` | Incognito page (see [IncognitoBrowserContext](https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#browsercreateincognitobrowsercontext)) for each URL  | No shared data. |
| `CONCURRENCY_BROWSER` | One browser (using an incognito page) per URL. If one browser instance crashes for any reason, this will not affect other jobs. | No shared data.  |

Describe pages, context, browsers TODO

### Examples
* Minimal example
* Crawling the Alexa Top 1 Million
* TODO Using JobData instead of string for URL when crawling (to cancel after some depth)
* TODO Queuing of functions
* TODO Improve Google crawl example

## TODO
* Allow queuing of functions (and data?) to be executed instead of URLs
* Check what happens if puppeteer is unable to run (not corretly installed, etc.)

## Features
Use this library, if you need a relibable crawler based on puppeteer. This library takes care of:
* Takes care of crawl errors, browser crashes, etc.
* Auto retries if a job fails
* Auto restarts chrome if the browser crashes
* Parallize using pages, contexts or browsers
* Scale up depending on your resources (CPU, memory)
* Simple to use, small boilerplate
* Progress view and monitoring board

### When to use this library (and when not)
* Use this library when you want to crawl more than 10 pages relibably (maybe even repeatedly)
* Don't use this library if you only want to crawl a few pages once. Of course, you can use this library in that case, but you are probably better off just using puppeteer without a cluster.
* Don't use this library if you don't want to use puppeteer. This library is built on puppeteer.

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

#### Cluster.task(task)
- `task` <[function]([string]|[Object], [Page], [Object])> Sets the function, which will be called for each job. The function will be called with three arguments (given below):
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `url` <[string]|[Object]> The data of the job you provided to [Cluster.queue]. This can either be a URL or an object containing additional data (including the URL). See example TODO for a more complex usage of the argument.
  - `options` <[Object]> An object containing additional information about your taks.
    - `worker` <[Object]> The worker executing the current URL.
      - `id` <[number]> ID of the worker. Worker IDs start at 0.
- returns: <[Promise]>

Specifies a task for the cluster. A task is called for each job you queue via [Cluster.queue]. Alternatively you can directly queue the function that you want to be executed. See [Cluster.queue] for an example.

#### Cluster.queue(url)
- `url` <[string]|[Object]> URL to be called or alternatively an object containing any information. The string or object will be provided to your task function(s). See example TODO for a more complex usage of this argument.
- returns: <[Promise]>

Puts a URL (a job) into the queue. TODO add options for queue(function) and queue(url, function)

#### Cluster.idle()
- returns: <[Promise]>

Promise is resolved when the queue becomes empty.

#### Cluster.close()
- returns: <[Promise]>

Closes the cluster and all opened Chromium instances including all open pages (if any were opened). It is recommended to run [Cluster.idle](#clusteridle) before calling this function. The [Cluster] object itself is considered to be disposed and cannot be used anymore.



[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[Page]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-page "Page"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Worker]: #class-worker "Worker"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Cluster]: #class-cluster "Cluster"
[puppeteer.launch]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#puppeteerlaunchoptions "puppeteer.launch"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Cluster.queue]: #Clusterqueueurl-options "Cluster.queue"
[Error]: https://nodejs.org/api/errors.html#errors_class_error "Error"
[Puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
