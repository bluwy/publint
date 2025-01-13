import { unpack } from '@publint/pack'
import { core } from './shared/core.js'
import { createTarballVfs } from './shared/vfs-tarball.js'

/**
 * @type {import('./index.d.ts').publint}
 */
export async function publint(options) {
  const pack = options?.pack
  if (!pack || typeof pack !== 'object') {
    throw new Error(
      '[publint] The `pack` option must be set to an object with `tarball` or `files` to work in the browser',
    )
  }

  /** @type {import('./shared/core.js').Vfs} */
  let vfs
  /** @type {string | undefined} */
  let overridePkgDir
  if ('tarball' in pack) {
    const result = await unpack(pack.tarball)
    vfs = createTarballVfs(result.files)
    overridePkgDir = result.rootDir
  } else {
    vfs = createTarballVfs(pack.files)
  }

  return await core({
    pkgDir: options.pkgDir ?? overridePkgDir ?? '/',
    vfs,
    level: options.level ?? 'suggestion',
    strict: options?.strict ?? false,
  })
}
