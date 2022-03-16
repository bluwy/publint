import { puba as _puba } from '../src/index.js'

/**
 * @type {import('types').puba}
 */
export function puba(options) {
  return _puba({
    pkgDir: options.pkgDir ?? '/',
    vfs: options.vfs
  })
}
