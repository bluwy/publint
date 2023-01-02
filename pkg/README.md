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
$ publint --help

  Usage
    $ publint [dir] [options]

  Options
    -v, --version    Displays current version
    -h, --help       Displays this message
```

### API

```js
import { publint } from 'publint'

const messages = await publint({
  /**
   * Path to your package that contains a package.json file.
   * Defaults to `process.cwd()` in node, `/` in browser.
   */
  pkgDir: './path/to/package'
  /**
   * A virtual file-system object that handles fs/path operations.
   * This field is required if you're using in the browser.
   */
  vfs: createCustomVfsObj()
})

console.log(messages)
```

## License

MIT
