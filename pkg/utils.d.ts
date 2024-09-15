import type { Message } from './index.js'

type Pkg = Record<string, any>

export interface FormatMessageOpt {
  /**
   * Used to determine if the returned string contains color.
   * - true: Force has color.
   * - false: Force no color.
   * - undefined: Default to whether the environment supports color (already handled by picocolors by default).
   */
  color?: boolean | undefined
}

export declare function formatMessagePath(path: string[]): string
export declare function getPkgPathValue(pkg: Pkg, path: string[]): any
export declare function formatMessage(
  msg: Message,
  pkg: Pkg,
  opt?: FormatMessageOpt
): string | undefined
