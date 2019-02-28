# Contributing

Feel free to open issues or submit pull requests. :)

## Releases

Releases are automatically published to npm by Travis CI. To successfully create a release the following preconditions have to be met:
- The commit has to be on the master.
- The commit has to be tagged.
- The build has to pass the tests.

To create a new release, follow these steps (my publishing TODO list).

#### Prepare Release
1. Make sure all tests pass: `npm run test`
2. Make sure [CHANGELOG.md](./CHANGELOG.md) contains the changes and the current date next to the version.

#### Release
1. `npm version [patch|minor|major]`
2. `git push --follow-tags`

After 2-30min, a new version should be published on npm. To check which files are being published, check Travis log or [unpkg.com](https://unpkg.com/puppeteer-cluster/).