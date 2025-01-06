# publint

## 0.3.0

### Minor Changes

- The `vfs` option is removed in favour of an extended support of `pack: { tarball: ArrayBuffer | ReadableStream }` and `pack: { files: PackFile[] }` APIs. Now, it is even easier to use `publint` in the browser or against a packed `.tgz` file in Node.js. See the docs for more examples of how to use these new options. ([#122](https://github.com/bluwy/publint/pull/122))

- Bump node version support to >=18 ([`cb2ed8b`](https://github.com/bluwy/publint/commit/cb2ed8b052146b25607f2f19d9a2c53c3d8b2f2e))

- `publint` now runs your project's package manager's `pack` command to get the list of packed files for linting. The previous `npm-packlist` dependency is now removed. ([#120](https://github.com/bluwy/publint/pull/120))

  A new `pack` option is added to the node API to allow configuring this. It defaults to `'auto'` and will automatically detect your project's package manager using [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector). See its JSDoc for more information of the option.

  This change is made as package managers have different behaviors for packing files, so running their `pack` command directly allows for more accurate linting. However, as a result of executing these commands in a child process, it may take 200-500ms longer to lint depending on the package manager used and the project size. The new handling also does not support yarn 1. See [this comment](https://github.com/bluwy/publint/issues/11#issuecomment-2176160022) for more information.

  If you use yarn 1, you should upgrade to the latest yarn version or a different package manager. Otherwise, no other changes are required for this new behavior.

### Patch Changes

- Initial setup to publish with Changesets ([`24a62f5`](https://github.com/bluwy/publint/commit/24a62f57dd1e5fc6e6410d3e2f99811475b61480))

- When a dependency with the `file:` or `link:` protocol is specified in the `package.json`, it will now error to prevent accidentally publishing dependencies that will likely not work when installed by end-users ([`6e6ab33`](https://github.com/bluwy/publint/commit/6e6ab33dd2180cc7d770a92353f67cb674964102))

- Fix `EXPORT_TYPES_INVALID_FORMAT` linting to detect `.d.mts` and `.d.cts` files ([`af5e88b`](https://github.com/bluwy/publint/commit/af5e88b4d3d5260b532a6cdbbde7216a785c0e07))

- Updated dependencies [[`d0b406b`](https://github.com/bluwy/publint/commit/d0b406befb0f76efc0936f9afb1e6c4679bcbdfb)]:
  - @publint/pack@0.1.0
