export interface Options {
  /**
   * The package manager to use for packing.
   *
   * @default 'npm'
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  /**
   * How to pack the given directory to get the list of files:
   * - `'json'`: Uses `<pm> pack --json` (works with all package manager except pnpm <9.14.1 and bun).
   * - `'pack'`: Uses `<pm> pack --pack-destination` (works with all package managers).
   * - `'json-and-pack'`: Tries to use `'json'` first, and if it fails, falls back to `'pack'`.
   *
   * NOTE: Theoretically, `'json'` should be faster than `'pack'`, but all
   * package managers seem to only support it as an alternate stdout format
   * and there's no significant speed difference in practice. However, `'json'`
   * performs less fs operations internally so should still be slightly faster.
   *
   * @default 'json-and-pack'
   */
  strategy?: 'json' | 'pack' | 'json-and-pack'
}

/**
 * Packs the given directory and returns a list of relative file paths that were packed.
 */
export function packlist(dir: string, opts?: Options): Promise<string[]>
