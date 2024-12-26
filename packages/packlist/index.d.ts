export interface Options {
  /**
   * The package manager to use for packing.
   *
   * @default 'npm'
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm'
  /**
   * How to pack the given directory to figure out the list of files:
   * - `'json'`: Uses `pack --json` to get the list of files (faster, but only recently supported by pnpm).
   * - `'pack'`: Uses `pack --pack-destination` to get the list of files (slower, but works with all package managers).
   * - `'json-and-pack'`: Tries to use `'json'` first, and if it fails, falls back to `'pack'`.
   *
   * @default 'json-and-pack'
   */
  strategy?: 'json' | 'pack' | 'json-and-pack'
}

/**
 * Packs the given directory and returns a list of relative file paths that were packed.
 */
export function packlist(dir: string, opts?: Options): Promise<string[]>
