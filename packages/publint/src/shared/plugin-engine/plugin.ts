import type { PackageJson, Vfs } from '../types.js'
import type { Issue } from './issue.js'
import type { Resolve } from './resolve.js'

export interface Plugin {
  /**
   * The plugin name. Use `:` as a separator if this plugin is a subset of another plugin.
   */
  name: string
  // Runs in parallel
  lint?: (api: LintApi) => void | Promise<void>
}

export interface LintApi {
  root: string
  pkg: PackageJson // Better-typed `package.json` object
  originalPkg: PackageJson // Better-typed `package.json` object
  files: string[] // All files packed in the tarball. Use `vfs` to load them.
  vfs: Vfs // Same as the current `vfs` option object

  // Resolve the `id` to a specific path
  resolve: Resolve

  // Report an issue
  report: (issue: Issue) => void
}
