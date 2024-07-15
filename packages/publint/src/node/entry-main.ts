import fsp from 'node:fs/promises'
import path from 'node:path'
import {
  getTarballPkgJson,
  getTarballRoot,
  resolvePlugins,
  warn
} from '../shared/utils.js'
import { engine } from '../shared/plugin-engine/engine.js'
import { createVfs } from './vfs.js'
import { pack } from './pack.js'
import { rewriteTarballFilePaths, unpack } from './unpack.js'
import type { Options, Result } from '../shared/types.js'
import { printResult } from './print.js'

export type { Options, Result }

export async function publint(options: Options = {}): Promise<Result> {
  if (options.tarball != null) {
    if (options.root != null) {
      warn(
        `The \`root\` option is not used when the \`tarball\` option is provided`
      )
    }
    if (options.pack != null) {
      warn(
        `The \`pack\` option is not used when the \`tarball\` option is provided`
      )
    }
  }

  const root = options.root ?? process.cwd()

  const tarball = await pack(root, options.pack ?? 'auto')
  const tarballFiles = await unpack(tarball)

  const tarballRoot = getTarballRoot(tarballFiles)
  const pkg = getTarballPkgJson(tarballFiles)
  const originalPkg = JSON.parse(
    await fsp.readFile(path.join(root, 'package.json'), 'utf8')
  )

  rewriteTarballFilePaths(tarballFiles, root)

  const vfs = createVfs()
  const resolvedIssues = await engine({
    root,
    pkg,
    originalPkg,
    files: tarballFiles.map((f) =>
      path.resolve(root, f.name.slice(tarballRoot.length + 1))
    ),
    vfs: createVfs(),
    plugins: resolvePlugins(options.plugins ?? [])
  })

  const result: Result = { issues: resolvedIssues, vfs }

  if (options.print) {
    printResult(result)
  }

  return result
}
