import type { ResolvedIssue } from './issue.js'
import type { LintApi, Plugin } from './plugin.js'
import { createResolve } from './resolve.js'
import type { PackageJson, Vfs } from '../types.js'

interface EngineOptions {
  root: string
  pkg: PackageJson
  originalPkg: PackageJson | null
  files: string[]
  vfs: Vfs
  plugins: Plugin[]
}

export async function engine(options: EngineOptions) {
  const issues: ResolvedIssue[] = []
  const resolve = createResolve(options.pkg, options.files, options.vfs)

  const sharedLintApi: Omit<LintApi, 'report'> = {
    root: options.root,
    pkg: options.pkg,
    originalPkg: options.pkg,
    files: options.files,
    vfs: options.vfs,
    resolve
  }

  const lintPromises: Promise<void>[] = []
  for (const plugin of options.plugins) {
    if (!plugin.lint) continue

    const lintApi: LintApi = {
      ...sharedLintApi,
      report(issue) {
        issues.push({
          ...issue,
          rule: `${plugin.name.split(':')[0]}/${issue.rule}`,
          pluginName: plugin.name
        })
      }
    }
    lintPromises.push(runLintHook(plugin, lintApi))
  }
  await Promise.all(lintPromises)

  return issues
}

async function runLintHook(plugin: Plugin, lintApi: LintApi) {
  try {
    let lintResult = plugin.lint!(lintApi)
    // @ts-expect-error Be a little defensive with the .then check
    if (typeof lintResult === 'object' && lintResult.then) {
      lintResult = await lintResult
    }
  } catch (e) {
    if (typeof e === 'object') {
      // @ts-expect-error Figure if we want a blessed PublintError interface in the future
      e.pluginName = plugin.name
    }
    throw e
  }
}
