# @publint/packlist

Get a list of files packed by a package manager. Supports:

- npm (v8, v9, v10)
- yarn (v3, v4)
- pnpm (v8, v9)

## Usage

```js
import { packlist } from '@publint/packlist'

const packageDir = process.cwd()

const files = await packlist(packageDir, {
  // options...
})
console.log(files)
// => ['src/index.js', 'package.json']
```

### Options

#### `packageManager`

- Type: `'npm' | 'yarn' | 'pnpm' | 'bun'`
- Default: `'npm'`

The package manager to use for packing. An external package can be used to detect the preferred package manager if needed, e.g. [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector).

#### `strategy`

- Type: `'json' | 'pack' | 'json-and-pack'`
- Default: `'json-and-pack'`

How to pack the given directory to figure out the list of files:

- `'json'`: Uses `pack --json` to get the list of files (faster, but only recently supported by pnpm).
- `'pack'`: Uses `pack --pack-destination` to get the list of files (slower, but works with all package managers).
- `'json-and-pack'`: Tries to use `'json'` first, and if it fails, falls back to `'pack'`.

## Comparison

Compared to [`npm-packlist`](https://github.com/npm/npm-packlist), this package works at a higher level by invoking the package manager `pack` command to retrieve the list of files packed. While `npm-packlist` is abstracted away from `npm` to expose a more direct API, unfortunately not all package managers pack files the same way, e.g. the patterns in `"files"` may be interpreted differently. Plus, since `npm-packlist` v7, it requires `@npmcli/arborist` to be used together, which is a much larger dependency to include altogether.

This package provides an alternative API that works across package managers with a much smaller package size. However, as it executes commands in a child process, it's usually slightly slower (around 200-500ms minimum depending on package manager used and the project size).

## License

MIT
