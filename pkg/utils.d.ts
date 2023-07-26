import type { Message } from './index.js'

type Pkg = Record<string, any>

export declare function formatMessagePath(path: string[]): string
export declare function getPkgPathValue(pkg: Pkg, path: string[]): any
export declare function formatMessage(
  msg: Message,
  pkg: Pkg
): string | undefined
