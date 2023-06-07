import fs from 'node:fs/promises'
import path from 'node:path'
import packlist from 'npm-packlist'
import { publint as _publint } from '../src/index.js'
import { createNodeVfs } from '../src/vfs.js'

/**
 * @type {import('..').publint}
 */
export async function publint(options) {
  const pkgDir = options?.pkgDir ?? process.cwd()
  const packedFiles = (await packlist({ path: pkgDir })).map((file) =>
    path.join(pkgDir, file)
  )

  return _publint({
    pkgDir,
    vfs: options?.vfs ?? createNodeVfs(),
    level: options?.level ?? 'suggestion',
    strict: options?.strict ?? false,
    _packedFiles: packedFiles
  })
}
