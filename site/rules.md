# Rules

Below is an unordered list of rules used by `publint` for linting.

## `IMPLICIT_INDEX_JS_INVALID_FORMAT`

If there are no entrypoints specified, e.g. `main`, `module`, `exports`, it's assumed that the root `index.js` is loaded by default. If the file has an invalid format, the error is reported.

## `FILE_INVALID_FORMAT`

If the file has an invalid format through explicit entrypoints, the error is reported.

## `FILE_INVALID_EXPLICIT_FORMAT`

If the file has an invalid format through explicit entrypoints, and the file has an explicit extension too, e.g. `.mjs` and `.cjs`, the error is reported.

## `FILE_DOES_NOT_EXIST`

The specified file does not exist.

## `FILE_NOT_PUBLISHED`

The specified file exists locally but isn't published to npm. This error only appears when running `publint` locally.

## `MODULE_SHOULD_BE_ESM`

The `module` entry should be ESM only.

## `HAS_MODULE_BUT_NO_EXPORTS`

If the package has a `module` entry without a `exports` entry, suggest using `exports` instead.

## `HAS_ESM_MAIN_BUT_NO_EXPORTS`

If the `main` entrypoint is an ES module, it's recommended to use the `exports` field instead as it's initially introduced for better ESM compatibility.

If you're not supporting NodeJS 12.6 and below, you can also remove the `main` field as all tooling would read from `exports` only and skip `main`.

## `EXPORTS_GLOB_NO_MATCHED_FILES`

If the `exports` entry contains glob paths, but it doesn't match any files, suggest the issue.

## `EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING`

The `exports` entry should not have globs defined with trailing slashes. It is [deprecated](https://nodejs.org/docs/latest-v16.x/api/packages.html#subpath-folder-mappings) and should use `/*` instead.

## `EXPORTS_TYPES_SHOULD_BE_FIRST`

Ensure `types` condition to be the first. [More info](https://www.typescriptlang.org/docs/handbook/esm-node.html#packagejson-exports-imports-and-self-referencing).

## `EXPORTS_DEFAULT_SHOULD_BE_LAST`

Ensure `default` condition to be the last.

## `EXPORTS_MODULE_SHOULD_BE_ESM`

The `module` condition should be ESM only.

## `EXPORTS_VALUE_INVALID`

The exports value should start with a "./".

## `USE_EXPORTS_BROWSER`

The `browser` and `exports` `browser` condition works similarly, but it's usually better to use `exports` as it's widely supported.
