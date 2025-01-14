# publint

## 0.3.2

### Patch Changes

- (Potentially breaking) Disable running lifecycle scripts, such as `prepare`, `prepack`, and `postpack`, when running the pack command internally. This returns to the behavior in v0.2. (Note that this change does not apply to yarn as it does not support ignoring lifecycle scripts for local projects) ([#128](https://github.com/publint/publint/pull/128))

  This change is made as running lifecycle scripts was an unintentional behavior during the v0.3 breaking change, which could cause the linting process to take longer than expected, or even cause infinite loops if `publint` is used in a lifecycle script.

- Update repository and bugs URLs to point to the new `publint` organization ([`1eda033`](https://github.com/publint/publint/commit/1eda0334e9f3647867dcc39d85fe04690ca9e543))

- Updated dependencies [[`1eda033`](https://github.com/publint/publint/commit/1eda0334e9f3647867dcc39d85fe04690ca9e543), [`10e3891`](https://github.com/publint/publint/commit/10e3891ba7f3d438c5c3c394423bdbc2078cf7e6)]:
  - @publint/pack@0.1.1

## 0.3.1

### Patch Changes

- Correctly process the `pack` option ([#124](https://github.com/publint/publint/pull/124))

## 0.3.0

### Minor Changes

- The `vfs` option is removed in favour of an extended support of `pack: { tarball: ArrayBuffer | ReadableStream }` and `pack: { files: PackFile[] }` APIs. Now, it is even easier to use `publint` in the browser or against a packed `.tgz` file in Node.js. See the docs for more examples of how to use these new options. ([#122](https://github.com/publint/publint/pull/122))

- Bump node version support to >=18 ([`cb2ed8b`](https://github.com/publint/publint/commit/cb2ed8b052146b25607f2f19d9a2c53c3d8b2f2e))

- `publint` now runs your project's package manager's `pack` command to get the list of packed files for linting. The previous `npm-packlist` dependency is now removed. ([#120](https://github.com/publint/publint/pull/120))

  A new `pack` option is added to the node API to allow configuring this. It defaults to `'auto'` and will automatically detect your project's package manager using [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector). See its JSDoc for more information of the option.

  This change is made as package managers have different behaviors for packing files, so running their `pack` command directly allows for more accurate linting. However, as a result of executing these commands in a child process, it may take 200-500ms longer to lint depending on the package manager used and the project size. The new handling also does not support yarn 1. See [this comment](https://github.com/publint/publint/issues/11#issuecomment-2176160022) for more information.

  If you use yarn 1, you should upgrade to the latest yarn version or a different package manager. Otherwise, no other changes are required for this new behavior.

  > NOTE: In this release (v0.3.0), the `pack` command also runs lifecycle scripts like `prepare`, `prepack`, and `postpack`. This behavior is unintentional and is fixed in v0.3.2, where they will no longer run (except for yarn as it does not support ignoring lifecycle scripts for local projects). This returns to the behavior in v0.2.

### Patch Changes

- Initial setup to publish with Changesets ([`24a62f5`](https://github.com/publint/publint/commit/24a62f57dd1e5fc6e6410d3e2f99811475b61480))

- When a dependency with the `file:` or `link:` protocol is specified in the `package.json`, it will now error to prevent accidentally publishing dependencies that will likely not work when installed by end-users ([`6e6ab33`](https://github.com/publint/publint/commit/6e6ab33dd2180cc7d770a92353f67cb674964102))

- Fix `EXPORT_TYPES_INVALID_FORMAT` linting to detect `.d.mts` and `.d.cts` files ([`af5e88b`](https://github.com/publint/publint/commit/af5e88b4d3d5260b532a6cdbbde7216a785c0e07))

- Updated dependencies [[`d0b406b`](https://github.com/publint/publint/commit/d0b406befb0f76efc0936f9afb1e6c4679bcbdfb)]:
  - @publint/pack@0.1.0
