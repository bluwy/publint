import fs from 'node:fs/promises'
import path from 'node:path'
import packlist from 'npm-packlist'
import { publint as _publint } from '../src/index.js'
import { createNodeVfs } from '../src/vfs.js'

/**
 * @type {import('.').publint}
 */
export async function publint(options) {
  const pkgDir = options?.pkgDir ?? process.cwd()

  // Find packed files for `publint` `_include` if no `exports` field.
  // This is because without `exports` field, all files can be accessed
  // by the consumer, but we need to know which files are packed,
  // since those are the ones getting published.
  const rootPkgContent = await fs.readFile(
    path.join(pkgDir, 'package.json'),
    'utf8'
  )
  const rootPkg = JSON.parse(rootPkgContent)
  const hasExports = !!rootPkg.exports
  const packedFiles = hasExports
    ? []
    : (await packlist({ path: pkgDir })).map((file) => path.join(pkgDir, file))

  return _publint({
    pkgDir,
    vfs: options?.vfs ?? createNodeVfs(),
    level: options?.level,
    _include: hasExports
      ? undefined
      : (p) => packedFiles.some((file) => file.startsWith(p))
  })
}
