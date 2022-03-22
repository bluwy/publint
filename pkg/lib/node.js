import { publint as _publint } from '../src/index.js'
import { createNodeVfs } from '../src/vfs.js'

/**
 * @type {import('types').publint}
 */
export function publint(options) {
  return _publint({
    pkgDir: options?.pkgDir ?? process.cwd(),
    vfs: options?.vfs ?? createNodeVfs()
  })
}
