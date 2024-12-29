---
'publint': minor
---

`publint` now runs your project's package manager's `pack` command to get the list of packed files for linting. The previous `npm-packlist` dependency is now removed.

A new `pack` option is added to the node API to allow configuring this. It defaults to `'auto'` and will automatically detect your project's package manager using [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector). See its JSDoc for more information of the option.

This change is made as package managers have different behaviors for packing files, so running their `pack` command directly allows for more accurate linting. However, as a result of executing these commands in a child process, it may take 200-500ms longer to lint depending on the package manager used and the project size. For more information, see [this comment](https://github.com/bluwy/publint/issues/11#issuecomment-2176160022).
