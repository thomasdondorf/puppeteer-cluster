# Puppeteer Cluster

Create a cluster of puppeteer workers.

## Install

Install puppeteer (TODO make this a peerDependency)

`npm install --save`

Install Puppeteer cluster

`npm install --save puppeteer-cluster`

Node version needs to be >= v8.10.0.

## Usage

TODO

## Features
Use this library, if you need a relibable crawler based on puppeteer. This library takes care of:
* Auto retrying if a job fails (TODO, not implemented yet)
* Restarting of chrome if the browser crashes
* Parallize using pages, contexts or browsers
* Scale up and down depending on your resources (CPU, memory) (TODO, not implemented yet)
* Simple to use, small boilerplate
* Progress view and monitoring board

### When to use this library (and when not)
* use when you want to crawl more than 10 pages relibably
* don't use if you do can not code
* don't use if you want to crawl less than 5 pages once

## API

TODO