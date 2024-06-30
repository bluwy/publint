import { engine } from '../shared/plugin-engine/engine.js'
import { unpack } from './unpack.js'
import {
  getTarballPkgJson,
  getTarballRoot,
  resolvePlugins,
  warn
} from '../shared/utils.js'
import { createVfs } from './vfs.js'
import type { Options, Result } from '../shared/types.js'

export type { Options, Result }

export async function publint(options: Options = {}): Promise<Result> {
  if (options.tarball == null) {
    throw new Error(
      `[publint] The \`tarball\` option is required when running in the browser`
    )
  }
  if (options.root != null) {
    warn(`The \`root\` option is not used in the browser`)
  }
  if (options.pack != null) {
    warn(`The \`pack\` option is not used in the browser`)
  }

  const tarballFiles = await unpack(options.tarball)
  const root = getTarballRoot(tarballFiles)
  const pkg = getTarballPkgJson(tarballFiles)

  const resolvedIssues = await engine({
    root,
    pkg,
    originalPkg: null,
    files: tarballFiles.map((f) => f.name),
    vfs: createVfs(tarballFiles),
    plugins: resolvePlugins(options.plugins ?? [])
  })

  return { issues: resolvedIssues }
}
