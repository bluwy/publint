# publint plugin

Goals

- works in both node and browser
- add additional messages
- stay performant

Design

```js
import {
  pathJoin,
  pathRelative,
  pathDirName,
  pathBaseName,
  pathExtName
} from 'publint/utils'

export default {
  name: 'core',
  setup(api) {
    api.vfs.readFile('/package/index.js', { format: 'utf-8' })
    api.vfs.readFile('/package/index.js', { format: 'array-buffer' })
    api.vfs.readDir('/package') // string[]
    api.vfs.isPathDir('/package') // true
    api.vfs.isPathExist('/package') // true

    api.report({
      type: 'warning',
      message: 'This is not correct',
      location: {
        path: '/package/index.js',
        start: 0,
        end: 10
      }
    })

    

    /// old

    api.files

    api.resolveFile()

    api.vfs.readFile()

    api.addMessage({
      code: 'IMPLICIT_INDEX_JS_INVALID_FORMAT',
      args: {
        actualFormat,
        expectFormat
      },
      path: ['name'],
      type: 'warning'
    })

    api.addMessage({
      msg: '',
      filePath: '',
      location: 100, // or array of strings for JSON, or start,end?
      args: {},
      nonSuppressable: true
    })
  }
}
```

```ts
interface File {
  content: string // getter
  name: string
  path: string

  imports: { specifier: string; local: string[] } // getter
  exports: { specifier: string; local: string[] } // getter
  requires: { specifier: string; local: string[] } // getter
  moduleExports: string[] // getter
}
```

Problem:

When disabling certain
