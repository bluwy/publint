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
      packedFiles = await detectAndPack(pkgDir, pack)
    }
    vfs = createNodeVfs()
  }

  return core({
    pkgDir: options?.pkgDir ?? overridePkgDir ?? process.cwd(),
    vfs,
    level: options?.level ?? 'suggestion',
    strict: options?.strict ?? false,
    _packedFiles: packedFiles,
  })
}

/**
 * @typedef {T extends string ? T : never} ExtractStringLiteral
 * @template T
 */

/**
 * @param {string} pkgDir
 * @param {ExtractStringLiteral<import('./index.d.ts').Options['pack']>} pack
 */
async function detectAndPack(pkgDir, pack) {
  let packageManager = pack

  if (packageManager === 'auto') {
    let detected = (await detect({ cwd: pkgDir }))?.name ?? 'npm'
    // Deno is not supported in `@publint/pack` (doesn't have a pack command)
    if (detected === 'deno') {
      detected = 'npm'
    }
    packageManager = detected
  }

  // When packing, we want to ignore scripts as `publint` itself could be used in one of them and could
  // cause an infinite loop. Also, running scripts might be slow and unexpected.

  // Yarn does not support ignoring scripts. If we know we're in a lifecycle event, try to warn about an infinite loop.
  // NOTE: this is not foolproof as one could invoke `yarn run <something>` within the lifecycle event, causing us
  // to unable to check if we're in a problematic lifecycle event.
  if (
    packageManager === 'yarn' &&
    ['prepack', 'postpack'].includes(process.env.npm_lifecycle_event ?? '')
  ) {
    throw new Error(
      `[publint] publint requires running \`yarn pack\` to lint the package, however, ` +
        `it is also being executed in the "${process.env.npm_lifecycle_event}" lifecycle event, ` +
        `which causes an infinite loop. Try to run publint outside of the lifecycle event instead.`,
    )
  }

  const list = await packAsList(pkgDir, { packageManager, ignoreScripts: true })
  return list.map((file) => path.join(pkgDir, file))
}
