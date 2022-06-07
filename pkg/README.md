# publint

Lint before you publish! Catch packaging errors and ensure compatibility across environments.

This package contains a CLI and API to lint packages locally. The package to be linted must exist and be built locally for the lint to succeed. To test other npm packages, try https://publint.bjornlu.com.

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
