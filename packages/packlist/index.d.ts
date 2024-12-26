export interface Options {
  /**
   * The package manager to use for packing. If `'auto'`, the package manager
   * will be inferred based on the lockfile found in and above the directory.
   * All package managers should support the `pack --json` command in order to
   * work.
   *
   * @default 'auto'
   */
  packageManager?: 'auto' | 'npm' | 'yarn' | 'pnpm'
  /**
   * How to pack the given directory to figure out the list of files:
   * - `'auto'`: Tries to use `'json'` first, and if it fails, falls back to `'pack'`.
   * - `'json'`: Uses `pack --json` to get the list of files (faster, but only recently supported by pnpm).
   * - `'pack'`: Uses `pack --pack-destination` to get the list of files (slower, but works with all package managers).
   */
  strategy?: 'auto' | 'json' | 'pack'
}

/**
 * Packs the given directory with `pack --json`, or if it fails, `pack --pack-destination`
 * and returns a list of relative file paths that were packed.
 */
export function packlist(dir: string, opts?: Options): Promise<string[]>
