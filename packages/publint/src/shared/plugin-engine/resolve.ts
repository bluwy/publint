import type { PackageJson, Vfs } from '../types.js'
import * as pathe from 'pathe'

type ResolvePreset =
  | 'esm'
  | 'cjs'
  | 'types'
  | 'package-json-main'
  | 'package-json-exports'

export interface Resolve {
  (
    id: string,
    importer?: string,
    options?: { preset?: ResolvePreset }
  ): Promise<ResolveResult | undefined>
}

export type ResolveResult =
  | { type: 'dependency'; name: string; subpath: string }
  | { type: 'dev-dependency'; name: string; subpath: string }
  | { type: 'protocol'; path: string }
  | { type: 'file'; path: string }

const bareSpecifierRegex = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/
const protocolSpecifierRegex = /^[a-z]{2,}:/

export function createResolve(
  pkg: PackageJson,
  files: string[],
  vfs: Vfs
): Resolve {
  const dependencyNames = Object.keys(pkg.dependencies ?? {})
  const devDependencyNames = Object.keys(pkg.devDependencies ?? {})
  const packageJsonDirToIsTypeModule = new Map<string, boolean>()

  files
    .filter((file) => file.endsWith('package.json'))
    .sort((a, b) => b.length - a.length)
    .forEach((file) => {
      packageJsonDirToIsTypeModule.set(
        pathe.dirname(file),
        pkg.type === 'module'
      )
    })

  return async (id, importer, options) => {
    let preset = options?.preset
    if (preset == null && importer) {
      if (importer.endsWith('package.json')) {
        preset = 'package-json-main'
      } else if (importer.endsWith('.mjs')) {
        preset = 'esm'
      } else if (importer.endsWith('.cjs')) {
        preset = 'cjs'
      } else if (importer.endsWith('.d.ts')) {
        preset = 'types'
      } else if (importer.endsWith('.js')) {
        let isTypeModule = false
        for (const [dir, typeModule] of packageJsonDirToIsTypeModule) {
          if (importer.startsWith(dir)) {
            isTypeModule = typeModule
            break
          }
        }
        preset = isTypeModule ? 'esm' : 'cjs'
      }
    }

    switch (preset) {
      case 'esm':
        return (
          tryResolveProtocol(id) ??
          tryResolveDependency(id) ??
          (await tryResolveFile(id, importer))
        )
      case 'cjs':
        return (
          tryResolveProtocol(id) ??
          tryResolveDependency(id) ??
          (await tryResolveFile(id, importer, ['.js', '/index.js']))
        )
      case 'types':
        return await tryResolveFile(id, importer, [
          ['.js', '.d.ts'],
          ['.mjs', '.d.mts'],
          ['.cjs', '.d.cts']
        ])
      case 'package-json-main':
        return await tryResolveFile(id, importer, ['.js', '/index.js'])
      case 'package-json-exports':
        return await tryResolveFile(id, importer)
      default:
        return await tryResolveFile(id, importer)
    }
  }

  /**
   * Handle protocol specifiers like, `node:fs`, `npm:chalk`, `bun:sql`, `virtual:my-pkg`, `something:else/instead` etc.
   * While it may be better to resolve and identify specifically as nodejs/bun builtin module, virtual module, or something else,
   * in practice, it's hard to be sure of it, e.g. if publint is running in the browser, or running in a different server environment.
   */
  function tryResolveProtocol(id: string): ResolveResult | undefined {
    if (protocolSpecifierRegex.test(id)) {
      return { type: 'protocol', path: id }
    }
  }

  /**
   *  Handle bare import specifiers, like `my-pkg`, `my-pkg/nested`, `@scope/my-pkg`, `virtual-my-pkg`, `~alias/something`, etc.
   * Try to match to dependencies or devDependencies if so.
   */
  function tryResolveDependency(id: string): ResolveResult | undefined {
    if (bareSpecifierRegex.test(id)) {
      let dependencySlashSeparator = id.indexOf('/')
      if (id[0] === '@') {
        dependencySlashSeparator = id.indexOf('/', dependencySlashSeparator + 1)
      }
      const dependencyName = id.slice(0, dependencySlashSeparator)
      const dependencySubpath = '.' + id.slice(dependencySlashSeparator + 1)

      if (dependencyNames.includes(id)) {
        return {
          type: 'dependency',
          name: dependencyName,
          subpath: dependencySubpath
        }
      }
      if (devDependencyNames.includes(id)) {
        return {
          type: 'dev-dependency',
          name: dependencyName,
          subpath: dependencySubpath
        }
      }
      // If it's not a dependency or devDependency, it may be a virtual module, alias path, missing dependency, etc.
      // However, we can't be sure that it will no longer match anything else, so we exit the block and continue resolving.
    }
  }

  async function tryResolveFile(
    id: string,
    importer?: string,
    extensions: (string | [string, string])[] = []
  ): Promise<ResolveResult | undefined> {
    const path = importer ? pathe.resolve(importer, id) : id

    if (await vfs.isPathExist(path)) {
      return { type: 'file', path }
    }

    for (const ext of extensions) {
      const newPath =
        typeof ext === 'string'
          ? ext[0] === '/' && path[path.length - 1] === '/'
            ? path.slice(0, -1) + ext
            : path + ext
          : id.endsWith(ext[0])
            ? path.slice(0, -ext[0].length) + ext[1]
            : undefined
      if (newPath && (await vfs.isPathExist(newPath))) {
        return { type: 'file', path: newPath }
      }
    }
  }
}
