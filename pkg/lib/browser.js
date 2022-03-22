import { publint as _publint } from '../src/index.js'

/**
 * @type {import('types').publint}
 */
export function publint(options) {
  return _publint({
    pkgDir: options.pkgDir ?? '/',
    vfs: options.vfs
  })
}
