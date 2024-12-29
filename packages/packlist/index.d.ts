export interface Options {
  /**
   * The package manager to use for packing.
   *
   * @default 'npm'
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /**
   * How to pack the given directory to figure out the list of files:
   * - `'json'`: Uses `pack --json` to get the list of files (works with all package manager except pnpm <9.14.1 and bun).
   * - `'pack'`: Uses `pack --pack-destination` to get the list of files (works with all package managers).
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
