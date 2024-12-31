import path from 'node:path'
import { detect } from 'package-manager-detector/detect'
import { packlist } from '@publint/packlist'
import { publint as _publint } from '../src/index.js'
import { unpackTarball } from '../src/utils-tar.js'
import { createNodeVfs } from '../src/vfs-node.js'
import { createTarballVfs } from '../src/vfs-tarball.js'

/**
 * @type {import('../index.d.ts').publint}
 */
export async function publint(options) {
  const pack = options?.pack ?? 'auto'

  /** @type {import('../src/index.js').Vfs} */
  let vfs
  /** @type {string | undefined} */
  let overridePkgDir
  /** @type {string[] | undefined} */
  let packedFiles
  // If a pack object is provided, that means the user declares its own virtual
  // file system, e.g. for cases where they have the tarball file in hand or prefers
  if (typeof pack === 'object') {
    if ('tarball' in pack) {
      const result = await unpackTarball(pack.tarball)
      vfs = createTarballVfs(result.files)
      overridePkgDir = result.rootDir
    } else {
      vfs = createTarballVfs(pack.files)
    }
  }
  // The rest options are used for manual packing and falls back to node vfs.
  // Only this flow allows publint to differentiate files that exist but not published.
  else {
    if (pack !== false) {
      const pkgDir = options?.pkgDir ?? process.cwd()

      let packageManager = (await detect({ cwd: pkgDir }))?.name
      // Deno is not supported in `@publint/packlist` (doesn't have a pack command)
      if (packageManager === 'deno') {
        packageManager = 'npm'
      }

      packedFiles = (await packlist(pkgDir, { packageManager })).map((file) =>
        path.join(pkgDir, file)
      )
    }
    vfs = createNodeVfs()
  }

  return _publint({
    pkgDir: options?.pkgDir ?? overridePkgDir ?? process.cwd(),
    vfs,
    level: options?.level ?? 'suggestion',
    strict: options?.strict ?? false,
    _packedFiles: packedFiles
  })
}
