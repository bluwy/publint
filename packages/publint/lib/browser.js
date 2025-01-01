import { publint as _publint } from '../src/index.js'
import { unpackTarball } from '../src/utils-tarball.js'
import { createTarballVfs } from '../src/vfs-tarball.js'

/**
 * @type {import('../index.d.ts').publint}
 */
export async function publint(options) {
  const pack = options?.pack
  if (!pack || typeof pack !== 'object') {
    throw new Error(
      '[publint] The `pack` option must be set to an object with `tarball` or `files` to work in the browser'
    )
  }

  /** @type {import('../src/index.js').Vfs} */
  let vfs
  /** @type {string | undefined} */
  let overridePkgDir
  if ('tarball' in pack) {
    const result = await unpackTarball(pack.tarball)
    vfs = createTarballVfs(result.files)
    overridePkgDir = result.rootDir
  } else {
    vfs = createTarballVfs(pack.files)
  }

  return await _publint({
    pkgDir: options.pkgDir ?? overridePkgDir ?? '/',
    vfs,
    level: options.level ?? 'suggestion',
    strict: options?.strict ?? false
  })
}
