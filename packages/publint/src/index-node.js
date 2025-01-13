import path from 'node:path'
import { detect } from 'package-manager-detector/detect'
import { packAsList, unpack } from '@publint/pack'
import { createNodeVfs } from './node/vfs-node.js'
import { core } from './shared/core.js'
import { createTarballVfs } from './shared/vfs-tarball.js'

/**
 * @type {import('./index.d.ts').publint}
 */
export async function publint(options) {
  const pack = options?.pack ?? 'auto'

  /** @type {import('./shared/core.js').Vfs} */
  let vfs
  /** @type {string | undefined} */
  let overridePkgDir
  /** @type {string[] | undefined} */
  let packedFiles
  // If a pack object is provided, that means the user declares its own virtual
  // file system, e.g. for cases where they have the tarball file in hand or prefers
  if (typeof pack === 'object') {
    if ('tarball' in pack) {
      const result = await unpack(pack.tarball)
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

      let packageManager = pack
      if (packageManager === 'auto') {
        let detected = (await detect({ cwd: pkgDir }))?.name ?? 'npm'
        // Deno is not supported in `@publint/pack` (doesn't have a pack command)
        if (detected === 'deno') {
          detected = 'npm'
        }
        packageManager = detected
      }

      // We want to ignore scripts as `publint` itself could be used in one of them and could
      // cause an infinite loop. Also, running scripts might be slow and unexpected.
      packedFiles = (
        await packAsList(pkgDir, { packageManager, ignoreScripts: true })
      ).map((file) => path.join(pkgDir, file))
    }
    vfs = createNodeVfs()
  }

  return core({
    pkgDir: options?.pkgDir ?? overridePkgDir ?? process.cwd(),
    vfs,
    level: options?.level ?? 'suggestion',
    strict: options?.strict ?? false,
    _packedFiles: packedFiles
  })
}
