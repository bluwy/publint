import { puba as _puba } from '../src/index.js'
import { createNodeVfs } from '../src/vfs.js'

/**
 * @type {import('types').puba}
 */
export function puba(options) {
  return _puba({
    pkgDir: options?.pkgDir ?? process.cwd(),
    vfs: options?.vfs ?? createNodeVfs()
  })
}
