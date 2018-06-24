# Puppeteer Cluster

Create a cluster of puppeteer workers.

## Install

Install puppeteer (if you not already have it installed), with at least version 1.5.

`npm install --save puppeteer`

Install Puppeteer cluster

`npm install --save puppeteer-cluster`

Currently tested with node versions >= v8.10.0.

## Usage

TODO

## Issues / Hints
* does not cache asynchronous errors outside of await/async in the task (example: setTimeout produces error) TODO give examples
* When timeout is hit, page might run longer, but never clears -> timeout of page.goto might be respected here TODO document that?

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
* TODO Using options.data.device when crawling
* TODO Multiple tasks, each URL is run by one task (example: crawl google results and extract page title from pages)
* TODO Multiple tasks, each URL is run by multiple tasks (example: multiple tests, that need to be executed)
* TODO Cancel after some depth of crawling a page, crawl each page only once

## TODO
* priority for jobs
* Continue a previously started cluster process
* Run multiple tasks per job

## Features
Use this library, if you need a relibable crawler based on puppeteer. This library takes care of:
* Takes care of crawl errors, browser crashes, etc.
* Auto retries if a job fails
* Auto restarts chrome if the browser crashes
* Parallize using pages, contexts or browsers
* Scale up and down depending on your resources (CPU, memory) (TODO, not implemented yet)
* Simple to use, small boilerplate
* Progress view and monitoring board

### When to use this library (and when not)
* Use this library when you want to crawl more than 10 pages relibably (maybe even repeatedly)
* Don't use this library if you only want to crawl a few pages once. Of course, you can use this library in that case, but you are probably better off just using puppeteer without a cluster.
* Don't use this library if you don't want to use puppeteer. This library is built on puppeteer.

## API

### class: Cluster

Cluster module provides a method to launch a cluster of Chromium instances.
The following is a typical example of using puppeteer-cluster:
```js
const Cluster = require('puppeteer-cluster');

(async () => {
  const cluster = await Cluster.launch();
  cluster.task(async (url, page) => {
    await page.goto(url);
    // ...
  });

  cluster.queue('http://www.google.com/');
  cluster.queue('http://www.wikipedia.org/');
  // many more pages

  await cluster.idle();
  await cluster.close();
})();
```

#### Cluster.launch(options)
- `options` <[Object]> Set of configurable options for the cluster. Can have the following fields:
  - `concurrency` <*Cluster.CONCURRENCY_PAGE*|*Cluster.CONCURRENCY_CONTEXT*|*Cluster.CONCURRENCY_BROWSER*> The choosen concurrency model. See [Concurreny models](#concurreny-models) for more information. Defaults to `Cluster.CONCURRENCY_CONTEXT`.
  - `maxConcurrency` <[number]> Maximal number of parallel workers. Set to `0` to deactivate (in case you want to rely only on maxCPU and/or maxMemory). Defaults to `1`.
  - TODO NOT WORKING YET `maxCPU` <[number]> Maximal usage of CPU in percentage (`100` means 100% workload) to allow spawning of more workers. Set to `0` to deactivate. Defaults to `0`.
  - TODO NOT WORKING YET `maxMemory` <[number]> Maximal usage of memory in percentage (`100` means use all availabe memory) to allow spawning of more workers. Set to `0` to deactivate. Defaults to `0`.
  - `puppeteerOptions` <[Object]> Object passed to [puppeteer.launch]. See puppeteer documentation for more information. Defaults to `{}`.
  - `retryLimit` <[number]> How often do you want to retry a job before marking it as failed. Defaults to `0`.
  - `retryDelay` <[number]> How much time should pass at minimum between the job execution and its retry. Defaults to `0`.
  - `sameDomainDelay` <[number]> How much time should pass at minimum between two requests to the same domain.
  - `skipDuplicateUrls` <[boolean]> If set to `true`, will skip URLs which were already crawled by the cluster. Defaults to `false`. TODO Currently it is still possible that two of the same URLs are processed when they are processed in parallel (will be fixed in the future)
  - `timeout` <[number]> Specify a timeout for all tasks. Can be overridden by [Cluster.task] and [Cluster.queue] options. Defaults to `30000` (30 seconds).
  - `monitor` <[boolean]> If set to `true`, will provide a small command line output to provide information about the crawling process. See TODO screenshot. Defaults to `false`.
- returns: <[Promise]<[Cluster]>>

The method launches a cluster instance.

#### Cluster.task(task[, options])
- `task` <[function]([string]|[Object], [Page], [Object])> Sets the function, which will be called for each job. The function will be called with three arguments (given below):
  - `url` <[string]|[Object]> The data of the job you provided to [Cluster.queue]. This can either be a URL or an object containing additional data (including the URL). See example TODO for a more complex usage of the argument.
  - `page` <[Page]> The page given by puppeteer, which provides methods to interact with a single tab in Chromium.
  - `options` <[Object]> An object containing additional information about your taks.
    - `worker` <[Object]> The worker executing the current URL.
      - `id` <[number]> ID of the worker. Worker IDs start at 0.
- TODO NOT WORKING YET `options` <[Object]> Optional information about the task
  - TODO NOT WORKING YET `name` <[string]> Specify the name when you have multiple differen tasks. Use `context.task` when calling the `queue` function to specify which task should execute the URL.
  - TODO NOT WORKING YET `timeout` <[number]> Optional parameter to specify a timeout for task executions. Overrides the cluster options.
- returns: <[Promise]>

Specifies a task for the cluster. A task is called for each job you queue via [Cluster.queue]. You can specify multiple tasks by naming them via `options.name`. Check out the example TODO for more information about multiple tasks.

#### Cluster.queue(url[, options])
- `url` <[string]|[Object]> URL to be called or alternatively an object containing any information. The string or object will be provided to your task function(s). See example TODO for a more complex usage of this argument.
- TODO NOT WORKING YET `options`<[Object]> Optional parameter which allows to specify details about the task and set data for custom task execution.
    - TODO NOT WORKING YET `priority` <[number]> Optional argument specifying the priority of the URL.
    - TODO NOT WORKING YET `task` <[string]> If you have multiple tasks defined, you can specify the name of the task, which should handle the URL.
- returns: void TODO

Puts a URL (a job) into the queue. You can provide data specific to the job by using `options.data`. Check out the example TODO for more information related to that.

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
