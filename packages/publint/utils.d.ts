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
