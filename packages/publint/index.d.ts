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

export interface Options {
  /**
   * Path to your package that contains a package.json file.
   * Defaults to `process.cwd()` in node, `/` in browser.
   */
  pkgDir?: string
  /**
   * A virtual file-system object that handles fs/path operations.
   * This field is required if you're using in the browser.
   */
  vfs?: Vfs
  /**
   * The level of messages to log (default: `'suggestion'`).
   * - `suggestion`: logs all messages
   * - `warning`: logs only `warning` and `error` messages
   * - `error`: logs only `error` messages
   */
  level?: 'suggestion' | 'warning' | 'error'
  /**
   * Report warnings as errors.
   */
  strict?: boolean
}

export interface Vfs {
  readFile: (path: string) => Promise<string>
  readDir: (path: string) => Promise<string[]>
  isPathDir: (path: string) => Promise<boolean>
  isPathExist: (path: string) => Promise<boolean>
  pathJoin: (...paths: string[]) => string
  pathRelative: (from: string, to: string) => string
  getDirName: (path: string) => string
  getExtName: (path: string) => string
}

export interface Result {
  messages: Message[]
}

export declare function publint(options?: Options): Promise<Result>
