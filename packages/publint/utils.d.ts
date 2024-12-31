import type { Message } from './index.js'

type Pkg = Record<string, any>

export interface FormatMessageOptions {
  /**
   * Whether the returned string should contain color.
   * - `true`: Force has color.
   * - `false`: Force no color.
   * - `undefined`: Default to whether the environment supports color.
   */
  color?: boolean | undefined
}

export declare function formatMessagePath(path: string[]): string
export declare function getPkgPathValue(pkg: Pkg, path: string[]): any
export declare function formatMessage(
  msg: Message,
  pkg: Pkg,
  opts?: FormatMessageOptions
): string | undefined

export interface TarballFile {
  name: string
  data: Uint8Array
}

export interface UnpackTarballResult {
  /**
   * The packed files. Usually with names like "package/src/index.js".
   */
  files: TarballFile[]
  /**
   * The root/shared directory among all packed files, e.g. "package".
   *
   * Usually npm-packed tarball uses "package" as the root directory,
   * however some publishes, like from `@types/*` have different root
   * directories instead. This field helps to identify it.
   */
  rootDir: string
}

/**
 * Unpacks an npm-packed tarball (or by similar js package managers).
 *
 * NOTE: This is not a generall `.tgz` file unpack API. It's internal logic
 * are written with the assumption for npm-packed tarballs only.
 */
export declare function unpackTarball(
  tarball: ArrayBuffer
): Promise<UnpackTarballResult>
