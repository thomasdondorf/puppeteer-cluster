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

#### Failed release
Sometimes a test fails on Travis and a new version is not published. In that case do the following:

1. Delete the tag from the local repository
    - `git tag -d v0.X.X`
2. Delete the tag from the remote repository
    - `git push --delete origin v0.X.X`
3. Fix the problem
4. Commit and push the (untagged) changes and make sure the tests succeed.
5. Manually tag the commit which fixes the problem
    - `git tag v0.X.X`
6. Push the tag
    - `git push --tags`

Now Travis will run again, hopefully succeeding this time.
