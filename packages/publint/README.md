<br>

<p align="center">
  <img src="https://user-images.githubusercontent.com/34116392/172312754-0407aeaa-d7a6-4ada-8bc0-ea80bc314f5f.svg" height="80">
</p>

<h1 align="center">
  publint
</h1>

<p align="center">
  Lint packaging errors. Ensure compatibility across environments.
</p>

<p align="center">
  <a href="https://publint.dev">
    <strong>Try it online</strong>
  </a>
</p>

<br>

This package contains a CLI and API to lint packages locally. The package to be linted must exist and be built locally for the lint to succeed. To test other npm packages, try https://publint.dev.

## Usage

### CLI

```bash
# Lint your library project
$ npx publint

# Lint a dependency
$ npx publint ./node_modules/some-lib

# Lint your project's dependencies based on package.json
$ npx publint deps
```

Use `npx publint --help` for more information.

### API

```js
import { publint } from 'publint'

const { messages } = await publint({
  /**
   * Path to your package that contains a package.json file.
   *
   * **Environment notes:**
   * - **Node.js**: Defualts to `process.cwd()`.
   * - **Browser**: Automatically inferred from `{ tarball: ArrayBuffer | ReadableStream }`. If `{ files: PackFile[] }` is used,
   *                this must be the shared directory of all files in `files`. e.g. if `name` has `"package/src/index.js",
   *                the `pkgDir` should be `"package"`.
   */
  pkgDir: './path/to/package',
  /**
   * The level of messages to log (default: `'suggestion'`).
   * - `suggestion`: logs all messages
   * - `warning`: logs only `warning` and `error` messages
   * - `error`: logs only `error` messages
   */
  level: 'warning',
  /**
   * The package manager to use for packing the `pkgDir`. The list of
   * packed files is used in certain linting rules, e.g. files marked as
   * entrypoints but not published.
   * - `'auto'`: Automatically detects the package manager using
   *             [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector).
   * - `'npm'`/`'yarn'`/`'pnpm'`/`'bun'`: Uses the respective package manager to pack.
   * - `{ tarball }`: Packs the package from the specified tarball represented as an `ArrayBuffer` or `ReadableStream`.
   * - `{ files }`: Packs the package using the specified files.
   * - `false`: Skips packing the package. This should only be used if all the files
   *            in `pkgDir` are assumed to be published, e.g. in `node_modules`.
   *
   * **Environment notes:**
   * - **Node.js**: Defaults to `'auto'`. All options above are supported. When using a package manager
   *                to pack, lifecycle scripts like `prepare`, `prepack`, and `postpack` are ignored
   *                (except for yarn as it does not allow ignoring lifecycle scripts).
   * - **Browser**: Only `{ tarball }` and `{ files }` are supported and either **must be passed** to work,
   *                as the browser does not have access to the file system.
   */
  pack: 'pnpm',
  /**
   * Report warnings as errors.
   */
  strict: true,
})

console.log(messages)
```

Extra utilities are exported under `publint/utils`:

```js
import { formatMessage } from 'publint/utils'
import fs from 'node:fs/promises'

const pkg = JSON.parse(
  await fs.readFile('./path/to/package/package.json', 'utf8'),
)

for (const message of messages) {
  // Prints default message in Node.js. Always a no-op in browsers.
  // Useful for re-implementing the CLI in a programmatic way.
  console.log(formatMessage(message, pkg))
}
```

> NOTE: The API for formatting and printing the message isn't the best right now, but this should be addressed in the next breaking release.

### Examples

```js
// Node.js: basic usage
import { publint } from 'publint'

const result = await publint({ pkgDir: './packages/mylib' })
```

```js
// Node.js / browser: lint a tarball
import { publint } from 'publint'

// Fetch tarball
const response = await fetch(
  'https://registry.npmjs.org/mylib/-/mylib-1.0.0.tgz',
)
if (!response.body) throw new Error('Failed to fetch tarball')

const result = await publint({ pack: { tarball: response.body } })
```

```js
// Node.js: lint a tarball locally
import fs from 'node:fs/promises'
import { publint } from 'publint'
import { unpack } from '@publint/pack'

const tarballBuffer = await fs.readFile('./mylib-1.0.0.tgz')
const result = await publint({ pack: { tarball: tarballBuffer.buffer } })
```

```js
// Node.js / browser: manually unpack and pass as files
import { publint } from 'publint'
import { unpack } from '@publint/pack'

// Fetch tarball
const response = await fetch(
  'https://registry.npmjs.org/mylib/-/mylib-1.0.0.tgz',
)
if (!response.body) throw new Error('Failed to fetch tarball')

const { rootDir, files } = await unpack(response.body)
// Do something with `files` if needed

const result = await publint({ pkgDir: rootDir, pack: { files } })
```

## License

MIT
