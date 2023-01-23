# Contribute to publint

## Setup

The project requires [`pnpm 7`](https://pnpm.io) and [`Node.js 16`](https://nodejs.org/en/). Run `pnpm install` to install dependencies of all workspace packages.

There are 2 parts to this repo:

- [pkg](./pkg) - The `publint` npm package
- [site](./site) - The website

## Development

### pkg

The `pkg` workspace has the `lib`, `src`, and `tests` directories.

`src` contains most of `publint`'s source code, and `lib` contains entrypoints that uses APIs from `src` (to provide default environment-specific information). You can check the `exports` field of `pkg/package.json` to see how they're linked.

`tests` contains unit tests that runs the test projects under `tests/fixtures`.

### site

The `site` workspace is a Vite & Svelte multiple page application. It powers https://publint.dev.

It has a `packfix` command (`pnpm packfix`) which packages up fixtures from [pkg/tests/fixtures](./pkg/tests/fixtures). Once packed, when running the dev server, you can search for the fixture name, e.g. `publint-test-1`, and it'll load the package locally. This can be used for quick testing.

## Testing

You can run the unit tests with `pnpm test` in the root or `pkg` directory.

## Pull requests

Pull request titles should preferably use the format of `<Verb> <something>`. First word is capitalized and singular. Examples:

- Fix docs styles
- Support JSX
- Update core options

Don't worry if it's not perfect! I'll tweak it before merging.

For commit messages, feel free to use your own convention and commit as much as you want. The pull request will be squashed merged into a single commit based on the pull request title.
