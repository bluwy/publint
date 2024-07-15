import type { ResolvedIssue } from './plugin-engine/issue.js'
import type { Plugin } from './plugin-engine/plugin.js'

export type PackOption = 'auto' | 'npm' | 'yarn' | 'pnpm'

export type PluginOption = Plugin | false | null | undefined | PluginOption[]

export interface Options {
  /**
   * The root path to a directory that contains a package.json file.
   *
   * **NOTE: Valid for Node.js usage only.**
   *
   * @default process.cwd()
   */
  root?: string

  /**
   * How to pack the package from `root`.
   *
   * **NOTE: Valid for Node.js usage only.**
   *
   * @default 'auto'
   */
  pack?: PackOption

  /**
   * The npm package tarball fetched as an ArrayBuffer.
   *
   * **NOTE: Valid for browser and Node.js usage. If used in Node.js, the `root` and `pack` options have no effect**
   *
   * Required in browsers.
   */
  tarball?: ArrayBuffer

  plugins?: PluginOption[]

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

  /**
   * Whether to print the result to the console automatically. If false,
   * you can print the result manually by calling `printResult(result)`.
   *
   * @default true
   */
  print?: boolean
}

export interface Result {
  issues: ResolvedIssue[]
  vfs: Vfs
}

export interface PackageJson {
  // General package metadata
  name?: string
  version?: string
  description?: string
  author?: string | { name: string; email?: string; url?: string }
  license?: string

  // Dependencies
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>

  // Other package metadata (that's usually safe to omit)
  type?: 'commonjs' | 'module'
  scripts?: Record<string, string>
  keywords?: string[]
  homepage?: string
  bugs?: string | { url: string; email?: string }
  contributors?: string[] | { name: string; email?: string; url?: string }[]
  maintainers?: string[] | { name: string; email?: string; url?: string }[]

  // Package entry points
  files?: string[]
  main?: string
  module?: string
  exports?: string | string[] | RecursiveExportsObject
  types?: string
  typings?: string
  browser?: string | string[] | Record<string, string | false>

  // Installation restrictions
  engines?: Record<string, string>

  // Misc
  [key: string]: unknown
}

interface RecursiveExportsObject {
  [key: string]: string | string[] | RecursiveExportsObject | null
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

export interface TarballFile {
  name: string
  buffer: Uint8Array
}
