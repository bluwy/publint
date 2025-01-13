export type MessageType = 'suggestion' | 'warning' | 'error'

interface BaseMessage<Code extends string, Args = Record<string, string>> {
  /**
   * The message code to narrow the message type
   */
  code: Code
  /**
   * Arguments used to be the final message
   */
  args: Args
  /**
   * The path to the key in the package.json which triggered this message
   */
  path: string[]
  /**
   * The type of message for sorting
   */
  type: MessageType
}

export type Message =
  | BaseMessage<
      'IMPLICIT_INDEX_JS_INVALID_FORMAT',
      { actualFormat: string; expectFormat: string }
    >
  | BaseMessage<
      'FILE_INVALID_FORMAT',
      {
        actualFormat: string
        expectFormat: string
        actualExtension: string
        expectExtension: string
        actualFilePath?: string
      }
    >
  | BaseMessage<
      'FILE_INVALID_EXPLICIT_FORMAT',
      {
        actualFormat: string
        expectFormat: string
        actualExtension: string
        expectExtension: string
        actualFilePath?: string
      }
    >
  | BaseMessage<
      'FILE_INVALID_JSX_EXTENSION',
      { actualExtension: string; globbedFilePath?: string }
    >
  | BaseMessage<'FILE_DOES_NOT_EXIST'>
  | BaseMessage<'FILE_NOT_PUBLISHED'>
  | BaseMessage<'MODULE_SHOULD_BE_ESM'>
  | BaseMessage<'HAS_MODULE_BUT_NO_EXPORTS'>
  | BaseMessage<'HAS_ESM_MAIN_BUT_NO_EXPORTS'>
  | BaseMessage<'EXPORTS_GLOB_NO_MATCHED_FILES'>
  | BaseMessage<
      'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING',
      {
        expectPath: string[]
        expectValue: string
      }
    >
  | BaseMessage<'EXPORTS_TYPES_SHOULD_BE_FIRST'>
  | BaseMessage<'EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE'>
  | BaseMessage<'EXPORTS_DEFAULT_SHOULD_BE_LAST'>
  | BaseMessage<'EXPORTS_MODULE_SHOULD_BE_ESM'>
  | BaseMessage<'EXPORTS_VALUE_INVALID', { suggestValue: string }>
  | BaseMessage<'EXPORTS_MISSING_ROOT_ENTRYPOINT', { mainFields: string[] }>
  | BaseMessage<'USE_EXPORTS_BROWSER'>
  | BaseMessage<'USE_EXPORTS_OR_IMPORTS_BROWSER'>
  | BaseMessage<'USE_FILES'>
  | BaseMessage<'USE_TYPE'>
  | BaseMessage<'USE_LICENSE', { licenseFilePath: string }>
  | BaseMessage<
      'TYPES_NOT_EXPORTED',
      {
        typesFilePath: string
        actualExtension?: string
        expectExtension?: string
      }
    >
  // TODO: rename EXPORT to EXPORTS (i messed up)
  | BaseMessage<
      'EXPORT_TYPES_INVALID_FORMAT',
      {
        condition: string
        actualFormat: string
        expectFormat: string
        actualExtension: string
        expectExtension: string
      }
    >
  | BaseMessage<
      'FIELD_INVALID_VALUE_TYPE',
      {
        actualType: string
        expectTypes: string[]
      }
    >
  | BaseMessage<
      'EXPORTS_VALUE_CONFLICTS_WITH_BROWSER',
      {
        /**
         * The path to the key inside the `"browser"` field that conflicts with
         * the current path `"exports"` field
         */
        browserPath: string[]
        browserishCondition: string
      }
    >
  | BaseMessage<'DEPRECATED_FIELD_JSNEXT'>
  | BaseMessage<
      'INVALID_REPOSITORY_VALUE',
      {
        type:
          | 'invalid-string-shorthand'
          | 'invalid-git-url'
          | 'deprecated-github-git-protocol'
          | 'shorthand-git-sites'
      }
    >
  | BaseMessage<'LOCAL_DEPENDENCY'>

export interface PackFile {
  name: string
  data: string | ArrayBuffer | Uint8Array
}

export interface Options {
  /**
   * Path to your package that contains a package.json file.
   *
   * **Environment notes:**
   * - **Node.js**: Defaults to `process.cwd()`.
   * - **Browser**: Automatically inferred from `{ tarball: ArrayBuffer | ReadableStream }`. If `{ files: PackFile[] }` is used,
   *                this must be the shared directory of all files in `files`. e.g. if `name` has `"package/src/index.js",
   *                the `pkgDir` should be `"package"`.
   */
  pkgDir?: string
  /**
   * The level of messages to log (default: `'suggestion'`).
   * - `suggestion`: logs all messages
   * - `warning`: logs only `warning` and `error` messages
   * - `error`: logs only `error` messages
   */
  level?: 'suggestion' | 'warning' | 'error'
  /**
   * The package manager to use for packing the `pkgDir`. The list of
   * packed files is used in certain linting rules, e.g. files marked as
   * entrypoints but not published.
   * - `'auto'`: Automatically detects the package manager using
   *             [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector).
   * - `'npm'`/`'yarn'`/`'pnpm'`/`'bun'`: Uses the respective package manager to pack.
   * - `{ tarball }`: Packs the package from the specified tarball represented as an`ArrayBuffer` or `ReadableStream`.
   * - `{ files }`: Packs the package using the specified files.
   * - `false`: Skips packing the package. This should only be used if all the files
   *            in `pkgDir` are assumed to be published, e.g. in `node_modules`.
   *
   * **Environment notes:**
   * - **Node.js**: Defaults to `'auto'`. All options above are supported. When using a package manager
   *                to pack, lifecycle scripts like `prepack` and `postpack` are ignored
   *                (except for yarn as it does not allow ignoring lifecycle scripts).
   * - **Browser**: Only `{ tarball }` and `{ files }` are supported and either **must be passed** to work,
   *                as the browser does not have access to the file system.
   */
  pack?:
    | 'auto'
    | 'npm'
    | 'yarn'
    | 'pnpm'
    | 'bun'
    | { tarball: ArrayBuffer | ReadableStream<Uint8Array> }
    | { files: PackFile[] }
    | false
  /**
   * Report warnings as errors.
   */
  strict?: boolean
}

export interface Result {
  messages: Message[]
}

export declare function publint(options?: Options): Promise<Result>
