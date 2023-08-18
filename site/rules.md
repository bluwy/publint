# Rules

Below is an unordered list of rules used by `publint` for linting.

## `IMPLICIT_INDEX_JS_INVALID_FORMAT`

If there are no entrypoints specified, e.g. via the `"main"`, `"module"`, and `"exports"` fields, it's assumed that the root `index.js` is the default entrypoint (if it exists). If the file has an invalid format, the error is reported.

An invalid format is defined as whether it has correct [ESM](https://nodejs.org/api/esm.html) or [CJS](https://nodejs.org/docs/latest/api/modules.html) usage. If a code is written in ESM or CJS, it doesn't mean that it would be interpreted as ESM or CJS respectively. In brief, it's dictated by:

- If the file extension is `.mjs`, or if the closest `package.json` has `"type": "module"`, it's interpreted as ESM.
- If the file extension is `.cjs`, or if the closest `package.json` does not have `"type": "module"`, it's interpreted as CJS.

`publint` will check these two behaviour if the file will be intepreted correctly.

## `FILE_INVALID_FORMAT`

If the file has an invalid format through explicit entrypoints, e.g. the `"main"`, `"module"`, and `"exports"` fields, the error is reported.

Invalid format checks are the same as [above](#implicit_index_js_invalid_format).

## `FILE_INVALID_EXPLICIT_FORMAT`

If the file has an invalid format through explicit entrypoints, e.g. the `"main"`, `"module"`, and `"exports"` fields, **and** the file has an explicit extension, e.g. `.mjs` and `.cjs`, the error is reported.

Invalid format checks are the same as [above](#implicit_index_js_invalid_format), except scoped down for explicit extensions for better error messages.

## `FILE_DOES_NOT_EXIST`

The specified file does not exist.

## `FILE_NOT_PUBLISHED`

The specified file exists locally but isn't published to npm. This error only appears when running `publint` locally.

## `MODULE_SHOULD_BE_ESM`

The `module` field should be ESM only as per convention.

## `HAS_MODULE_BUT_NO_EXPORTS`

If the package has a `"module"` field, but has no `"exports"` field, suggest to use `"exports"` instead. This is because Node.js doesn't recognize the `"module"` field, so instead using `"exports"` would increase compatibility with it.

If the package isn't meant for Node.js usage, it is safe to ignore this suggestion, but it is still recommended to use `"exports"` whenever possible.

## `HAS_ESM_MAIN_BUT_NO_EXPORTS`

If the `"main"` field is in ESM, but there's no `"exports"` field, it's recommended to use the `"exports"` field instead as it's initially introduced for better ESM compatibility.

If you're not supporting Node.js 12.6 and below, you can also remove the `"main"` field as all tooling would read from `"exports"` only and skip `"main"`.

## `EXPORTS_GLOB_NO_MATCHED_FILES`

If the `"exports"` field contains glob paths, but it doesn't match any files, report this issue.

## `EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING`

The `"exports"` field should not have globs defined with trailing slashes. It is [deprecated](https://nodejs.org/docs/latest-v16.x/api/packages.html#subpath-folder-mappings) and should use [subpath patterns](https://nodejs.org/api/packages.html#subpath-patterns), e.g. a trailing `/*` instead.

## `EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE`

Ensure the `"module"` condition comes before the `"require"` condition. Due to the way conditions are matched top-to-bottom, the `"module"` condition (used in bundler contexts only) must come before a `"require"` condition, so it has the opportunity to take precedence.

## `EXPORTS_TYPES_SHOULD_BE_FIRST`

Ensure `"types"` condition to be the first. The [TypeScript docs](https://www.typescriptlang.org/docs/handbook/esm-node.html#packagejson-exports-imports-and-self-referencing) recommends so, but it's also because the `"exports"` field is order-based.

For example, a scenario where both the `"types"` and `"import"` condition could be active, `"types"` should be first so that it matches and returns a `.d.ts` file, rather than a `.js` file from the `"import"` condition.

## `TYPES_NOT_EXPORTED`

Since TypeScript 5.0, it has supported the [`"moduleResolution": "bundler"` compiler option](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#moduleresolution-bundler) which has stricter rules on loading types (Additionally also affected by `"node16"` and `nodenext"`, and the [`"resolvePackageJsonExports"` compiler option](https://www.typescriptlang.org/tsconfig#resolvePackageJsonExports)).

When an `"exports"` field is found, only the `"types"` condition declared is respected, or if the resolved JS file has the correct adjacent `.d.ts` file. For example:

- `./dist/index.js` -> `./dist/index.d.ts`
- `./dist/index.mjs` -> `./dist/index.d.mts`
- `./dist/index.cjs` -> `./dist/index.d.cts`.

The root `"types"` field is ignored to respect the `"exports"` field module resolution algorithm.

This message may also provide helpful hints depending on the types format, which is explained below.

## `EXPORT_TYPES_INVALID_FORMAT`

When specifying the `"types"` conditions in the `"exports"` field, the types format is determined via its extension or its closest `package.json` `"type"` value, similar to the rule in [`IMPLICIT_INDEX_JS_INVALID_FORMAT`](#implicit_index_js_invalid_format). In short:

- If the file ends with `.d.mts`, or if it's `.d.ts` and the closest `package.json` has `"type": "module"`, it's interpreted as ESM.
- If the file ends with `.d.cjs`, or if it's `.d.ts` and the closest `package.json` does not have `"type": "module"`, it's interpreted as CJS.

An example of a correct configuration looks like this:

```json
{
  "exports": {
    "import": {
      "types": "./index.d.mts",
      "default": "./index.mjs"
    },
    "require": {
      "types": "./index.d.cts",
      "default": "./index.cjs"
    }
  }
}
```

## `EXPORTS_DEFAULT_SHOULD_BE_LAST`

Ensure `"default"` condition to be the last according to the [Node.js docs](https://nodejs.org/api/packages.html#conditional-exports), but it's also because the `"exports"` field is order-based.

The example [above](#exports_types_should_be_first) also applies here as to why it should be last.

## `EXPORTS_MODULE_SHOULD_BE_ESM`

The `"module"` condition should be ESM only. This condition is used to prevent the [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard) in bundlers so `import` and `require` will both resolve to this condition, deduplicating the dual instances. The [esbuild docs](https://esbuild.github.io/api/#how-conditions-work) has a more in-depth explanation.

## `EXPORTS_VALUE_INVALID`

The `"exports"` field value should always start with a `./`. It does not support omitted relative paths like `"subpath/index.js"`.

## `USE_EXPORTS_BROWSER`

The `"browser"` field with a string value and `"exports"` `"browser"` condition works similarly to define the browser counterpart of a package. With the overlap, it's usually better to use the `"exports"` field instead as it's widely supported, and keeps one true way of defining your package entrypoints.

## `USE_EXPORTS_OR_IMPORTS_BROWSER`

The `"browser"` field and `"exports"`/`"imports"` `"browser"` condition works similarly to define the browser counterpart of a package. With the overlap, it's usually better to use the `"exports"`/`"imports"` field instead as it's widely supported, and keeps one true way of defining your package entrypoints.

For example, the following `"browser"` field can be switched like this.

```json
{
  "browser": {
    "module-a": "./shims/module-a.js",
    "module-b": false,
    "./server/only.js": "./shims/client-only.js"
  }
}
```

```json
{
  "imports": {
    "#module-a": {
      "browser": "./shims/module-a.js",
      "default": "module-a"
    },
    "#module-b": {
      "browser": "./empty.js",
      "default": "module-b"
    },
    "#server-only.js": {
      "browser": "./shims/client-only.js",
      "default": "./server/only.js"
    }
  }
}
```

Note that you'll need to change all imports to use the specifier defined in `"imports"` field (e.g. `import foo from "module-a"` -> `import foo from "#module-a"`).

So switching to the `"exports"`/`"imports"` field may not be a one-to-one migration, and that's fine! Once you're ready to restructure your code, you can make these changes going forward.
