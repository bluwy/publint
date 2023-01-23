# Rules

Below is an unordered list of rules used by `publint` for linting.

## `IMPLICIT_INDEX_JS_INVALID_FORMAT`

If there are no entrypoints specified, e.g. via the `main`, `module`, and `exports` fields, it's assumed that the root `index.js` is the default entrypoint (if it exists). If the file has an invalid format, the error is reported.

An invalid format is defined as whether it has correct [ESM](https://nodejs.org/api/esm.html) or [CJS](https://nodejs.org/docs/latest/api/modules.html) usage. If a code is written in ESM or CJS, it doesn't mean that it would be interpreted as ESM or CJS respectively. In brief, it's dictated by:

- If the file extension is `.mjs`, or if the closest `package.json` has `"type": "module"`, it's interpreted as ESM.
- If the file extension is `.cjs`, or if the closest `package.json` does not have `"type": "module"`, it's interpreted as CJS.

`publint` will check these two behaviour if the file will be intepreted correctly.

## `FILE_INVALID_FORMAT`

If the file has an invalid format through explicit entrypoints, e.g. the `main`, `module`, and `exports` fields, the error is reported.

Invalid format checks are the same as [above](#implicit_index_js_invalid_format).

## `FILE_INVALID_EXPLICIT_FORMAT`

If the file has an invalid format through explicit entrypoints, e.g. the `main`, `module`, and `exports` fields, **and** the file has an explicit extension, e.g. `.mjs` and `.cjs`, the error is reported.

Invalid format checks are the same as [above](#implicit_index_js_invalid_format), except scoped down for explicit extensions for better error messages.

## `FILE_DOES_NOT_EXIST`

The specified file does not exist.

## `FILE_NOT_PUBLISHED`

The specified file exists locally but isn't published to npm. This error only appears when running `publint` locally.

## `MODULE_SHOULD_BE_ESM`

The `module` field should be ESM only as per convention.

## `HAS_MODULE_BUT_NO_EXPORTS`

If the package has a `module` field, but has no `exports` field, suggest to use `exports` instead. This is because Node.js doesn't recognize the `module` field, so instead using `exports` would increase compatibility with it.

If the package isn't meant for Node.js usage, it is safe to ignore this suggestion, but it is still recommended to use `exports` whenever possible.

## `HAS_ESM_MAIN_BUT_NO_EXPORTS`

If the `main` field is in ESM, but there's no `exports` field, it's recommended to use the `exports` field instead as it's initially introduced for better ESM compatibility.

If you're not supporting Node.js 12.6 and below, you can also remove the `main` field as all tooling would read from `exports` only and skip `main`.

## `EXPORTS_GLOB_NO_MATCHED_FILES`

If the `exports` field contains glob paths, but it doesn't match any files, report this issue.

## `EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING`

The `exports` field should not have globs defined with trailing slashes. It is [deprecated](https://nodejs.org/docs/latest-v16.x/api/packages.html#subpath-folder-mappings) and should use [subpath patterns](https://nodejs.org/api/packages.html#subpath-patterns), e.g. a trailing `/*` instead.

## `EXPORTS_TYPES_SHOULD_BE_FIRST`

Ensure `types` condition to be the first. The [TypeScript docs](https://www.typescriptlang.org/docs/handbook/esm-node.html#packagejson-exports-imports-and-self-referencing) recommends so, but it's also because the `exports` field is order-based.

For example, a scenario where both the `types` and `import` condition could be active, `types` should be first so that it matches and returns a `.d.ts` file, rather than a `.js` file from the `import` condition.

## `EXPORTS_DEFAULT_SHOULD_BE_LAST`

Ensure `default` condition to be the last according to the [Node.js docs](https://nodejs.org/api/packages.html#conditional-exports), but it's also because the `exports` field is order-based.

The example [above](#exports_types_should_be_first) also applies here as to why it should be last.

## `EXPORTS_MODULE_SHOULD_BE_ESM`

The `module` condition should be ESM only.

<!-- TODO: double check this as it's a webpack convention -->

## `EXPORTS_VALUE_INVALID`

The `exports` field value should always start with a `./`. It does not support omitted relative paths like `"subpath/index.js"`.

## `USE_EXPORTS_BROWSER`

The `browser` field and `exports` `browser` condition works similarly to define the browser counterpart of a package. With the overlap, it's usually better to use the `exports` field instead as it's widely supported, and keeps one true way of defining your package entrypoints.

It's important to note that the `browser` field can be used for [many more cases](https://github.com/defunctzombie/package-browser-field-spec), like:

- Replace the root entrypoint with a browser-safe file.
- Replace a nested file or module specifier with a browser-safe file.
- Ignore a specific module specifier so it's not loaded.

So switching to the `exports` field may not be a one-to-one migration, and that's fine! Once you're ready to restructure your code, you can make these changes going forward.
