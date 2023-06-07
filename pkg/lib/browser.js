import { publint as _publint } from '../src/index.js'

/**
 * @type {import('..').publint}
 */
export function publint(options) {
  if (!options?.vfs) {
    throw new Error('The vfs option is required in the browser')
  }

  return _publint({
    pkgDir: options.pkgDir ?? '/',
    vfs: options.vfs,
    level: options.level ?? 'suggestion',
    strict: options?.strict ?? false
  })
}
