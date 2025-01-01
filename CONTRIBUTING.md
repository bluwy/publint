# Contribute to publint

## Setup

The project requires [`pnpm 9`](https://pnpm.io) and [`Node.js 16`](https://nodejs.org/en/) (or above). Run `pnpm install` to install dependencies of all workspace packages.

There are 3 parts to this repo:

- [packages/publint](./packages/publint) - The `publint` npm package
- [site](./site) - The website
- [analysis](./analysis) - The analysis automation that lints popular npm packages for displaying their results on the website

## Development

### packages/publint

The `packages/publint` workspace has the `lib`, `src`, and `tests` directories.

`src` contains most of `publint`'s source code, and `lib` contains entrypoints that uses APIs from `src` (to provide default environment-specific information). You can check the `exports` field of `packages/publint/package.json` to see how they're linked.

`tests` contains unit tests that runs the test projects under `tests/fixtures`.

### site

The `site` workspace is a Vite & Svelte multiple page application. It powers https://publint.dev.

It has a `packfix` command (`pnpm packfix`) which packages up fixtures from [packages/publint/tests/fixtures](./packages/publint/tests/fixtures). Once packed, when running the dev server, you can search for the fixture name, e.g. `publint-test-1`, and it'll load the package locally. This can be used for quick testing.

### analysis

The `analysis` workspace contains a simple `index.js` script that runs `publint` on popular npm packages. Run `pnpm start` to run the script to compute the results. The downloaded package tarballs and results are cached in the `cache` directory, so subsequent runs are faster. Even so, the script will fetch npm to check the latest package versions, if you want to bypass this on subsequent runs as well, use the `--cache` flag. The final results are written to `cache/_results.json` and also loaded by the site locally.

The `pnpm gist` command uploads and stores the results to a [GitHub gist](https://gist.github.com/bluwy/64b0c283d8f0f3f8a8f4eea03c75a3b8). It is then proxied and served by https://publint.dev/analysis.json. This is automated to run on CI and by me ([@bluwy](https://github.com/bluwy)) only.

There's also an additional `pnpm bench` command that solely benchmarks the time it takes to lint the poplar packages. This can be used to test performance improvements. The caching mechanism is the same as `pnpm start`, and also supports the `--cache` flag.

## Testing

You can run the unit tests with `pnpm test` in the root to run all packages' tests.

NOTE 1: For `packages/pack`, it has a test setup that uses `corepack` and `bun` to test certain packing behaviors. `corepack` is installed by default but may not be enabled, its tests will temporarily enable it if not and disable again after its test is done. (In rare cases where `corepack` is not properly teared down, you may need to manually run `corepack disable` and `corepack disable npm` if you prefer to not use it). You may also optionally install `bun` (>=1.1.42) to run its bun-specific tests (automatically skipped if `bun` is not installed).

NOTE 2: As `packages/pack` uses `corepack`, it also requires a network connection to install the package manager binaries. If you've run the tests at least once, the binaries are cached and you can run the tests offline later.

## Pull requests

Pull request titles should preferably use the format of `<Verb> <something>`. First word is capitalized and singular. Examples:

- Fix docs styles
- Support JSX
- Update core options

Don't worry if it's not perfect! I'll tweak it before merging.

For commit messages, feel free to use your own convention and commit as much as you want. The pull request will be squashed merged into a single commit based on the pull request title.

If a change should result in a new release of a package (e.g. `packages/publint`), you can run `pnpm changeset` at the root of the project to create a changeset. See [.changeset/README.md](./.changeset/README.md) for more information. Changeset description should also follow the same format as pull request titles and can be more descriptive if needed.
