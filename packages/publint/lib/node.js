import path from 'node:path'
import packlist from 'npm-packlist'
import { publint as _publint } from '../src/index.js'
import { createNodeVfs } from '../src/vfs.js'

/**
 * @type {import('../index.d.ts').publint}
 */
export async function publint(options) {
  const pkgDir = options?.pkgDir ?? process.cwd()

  /** @type {string[] | undefined} */
  let packedFiles
  // only search for packed files if the consumer is not running on a virtual filesystem
  if (options?.vfs == null) {
    packedFiles = (await packlist({ path: pkgDir })).map((file) =>
      path.join(pkgDir, file)
    )
  }

  return _publint({
    pkgDir,
    vfs: options?.vfs ?? createNodeVfs(),
    level: options?.level ?? 'suggestion',
    strict: options?.strict ?? false,
    _packedFiles: packedFiles
  })
}
