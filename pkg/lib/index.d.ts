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
  | BaseMessage<'FILE_DOES_NOT_EXIST', { filePath: string }>
  | BaseMessage<'MODULE_SHOULD_BE_ESM'>
  | BaseMessage<'HAS_MODULE_BUT_NO_EXPORTS'>
  | BaseMessage<'HAS_ESM_MAIN_BUT_NO_EXPORTS'>
  | BaseMessage<'EXPORTS_GLOB_NO_MATCHED_FILES'>
  // TODO
  // | BaseMessage<'EXPORTS_GLOB_NO_MATCHED_FILES_BUT_IMPLICIT_INDEX_DETECTED'>
  | BaseMessage<'EXPORTS_TYPES_SHOULD_BE_FIRST'>
  | BaseMessage<'EXPORTS_DEFAULT_SHOULD_BE_LAST'>

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

export function publint(options?: Options): Promise<Message[]>
