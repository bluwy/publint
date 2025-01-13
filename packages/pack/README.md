# @publint/pack

Zero-dependencies utilities for packing and unpacking npm packages. Supports:

- npm (v8, v9, v10)
- yarn (v3, v4)
- pnpm (v8, v9)
- bun

## API

NOTE: All `pack*` APIs support passing `opts.packageManager` to specify the package manager to use for packing, and `opts.ignoreScripts` to skip running lifecycle scripts.

### `pack()`

- **Type**: `(dir: string, opts?: PackOptions): Promise<string>`

Packs the given directory and returns the packed tarball path. Pass `opts.destination` to change the output directory of the tarball.

```js
import { pack } from '@publint/pack'

const tarballPath = await pack(process.cwd())
console.log(tarballPath)
// => '/Users/bluwy/project/project-1.0.0.tgz'
```

### `packAsList()`

- **Type**: `(dir: string, opts?: PackAsListOptions): Promise<string>`

Packs the given directory and returns a list of relative file paths that were packed.

> [!NOTE]
> Compared to [`npm-packlist`](https://github.com/npm/npm-packlist), this API works at a higher level by invoking the package manager `pack` command to retrieve the list of files packed. While `npm-packlist` is abstracted away from `npm` to expose a more direct API, unfortunately not all package managers pack files the same way, e.g. the patterns in `"files"` may be interpreted differently. Plus, since `npm-packlist` v7, it requires `@npmcli/arborist` to be used together, which is a much larger dependency to include altogether.
>
> This package provides an alternative API that works across package managers with a much smaller package size. However, as it executes commands in a child process, it's usually slightly slower (around 200-500ms minimum depending on package manager used and the project size).

```js
import { packAsList } from '@publint/pack'

const files = await packAsList(process.cwd())
console.log(files)
// => ['src/index.js', 'package.json']
```

### `packAsJson()`

- **Type**: `(dir: string, opts?: PackAsJsonOptions): Promise<string>`

Packs the given directory with the `--json` flag and returns its stdout as JSON. You can run the `<pm> pack --json` command manually to inspect the output shape.

> [!NOTE]
> Does not work in pnpm <9.14.1 and bun as they don't support the `--json` flag.

```js
import { packAsJson } from '@publint/pack'

const json = await packAsJson(process.cwd())
console.log(json)
// => [{ "id": "project@1.0.0", ...  }]
```

### `unpack()`

- **Type**: `(tarball: ArrayBuffer | ReadableStream<Uint8Array>): Promise<UnpackResult>`

Unpacks the given tarball buffer (gzip-decompress + untar). It accepts either an `ArrayBuffer` or a `ReadableStream`. In Node.js, `ArrayBuffer` is faster, while in browsers, `ReadableStream` is faster. For example when using `fetch()`, you can decide between both types with its returned response: `response.arrayBuffer()` or `response.body`.

It returns an object with `files`, which is the list of unpacked files, and `rootDir`, which is the shared root directory among all files. (See JSDoc for examples)

```js
import { unpack } from '@publint/pack'

const response = await fetch(
  'https://registry.npmjs.org/mylib/-/mylib-1.0.0.tgz',
)
if (!response.body) throw new Error('Failed to fetch tarball')

const result = await unpack(response.body)
console.log(result)
// => { files: [...], rootDir: 'package' }
```

## License

MIT
