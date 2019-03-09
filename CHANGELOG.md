# Changelog
All notable changes to this project will be documented in this file.

## [0.15.2] - 2019-03-09
### Fixed
- Fixed bug, which crashed the cluster in some environments (#113)

## [0.15.1] - 2019-03-06
### Changed
- Changed when the `queue` event is emitted (after the job is queued into the internal queue).

## [0.15.0] - 2019-03-06
### Added
- Event `queue` added

## [0.14.0] - 2019-02-28
### Added
- Support for generics via `Cluster<InType, OutType>`

## [0.13.2] - 2019-02-26
### Fixed
- `package-lock.json` file was not updated

## [0.13.1] - 2019-02-26
### Fixed
- Internal helper function was accidentally set to public

## [0.13.0] - 2019-02-25
### Added
- `Cluster.execute` function added
- Examples for `Cluster.execute` added

## [0.12.1] - 2018-11-08
### Fixed
- Fixed support for custom concurrency implementations

## [0.12.0] - 2018-11-07
### Added
- Support for custom puppeteer libraries added
- Support for custom concurrency implementations added
### Changed
- Updated dependencies to their latest versions

## [0.11.2] - 2018-09-07
### Fixed
- Fixed another sameDomainDelay bug leading to high CPU usage

## [0.11.1] - 2018-09-06
### Fixed
- Fixed `sameDomainDelay` bug (issue #11)

## [0.11.0] - 2018-09-05
### Fixed
- Fixed rarely happening bug (issue #3), which made browser not able to restart

## [0.10.0] - 2018-08-21
### Added
- Node.js support for version 6 and 7 added

## [0.9.1] - 2018-07-18
### Fixed
- Circular structures led to crashs in case of crawling errors.

## [0.9.0] - 2018-07-13
### Changed
- Cluster.task function signature changed from `Cluster.task(page, url)` to `Cluster.task({ page, data })`. `Cluster.queue` can be passed any data instead of a string or object.

## 0.8.1 - 2018-07-08
### Fixed
- The timeout-promise for a task was not canceled when a task threw an error.

## 0.8.0 - 2018-07-04
### Added
- Cluster can be used without defining a Cluster.task function by queuing only functions.

### Fixed
- Page errors ("Page crashed!") were not caught so far

### Removed
- maxCPU and maxMemory options removed as they made no sense (better to check how much chromium your machine can handle.)
