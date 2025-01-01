interface SharedPackOptions {
  /**
   * The package manager to use for packing.
   *
   * @default 'npm'
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
}

export interface PackOptions extends SharedPackOptions {
  /**
   * The destination directory of the packed tarball
   */
  destination?: string
}
/**
 * Packs the given directory and returns the packed tarball path
 */
export function pack(dir: string, opts?: PackOptions): Promise<string>

export interface PackAsListOptions extends SharedPackOptions {}
/**
 * Packs the given directory and returns a list of relative file paths that were packed.
 */
export function packAsList(
  dir: string,
  opts?: PackAsListOptions
): Promise<string[]>

export interface PackAsJsonOptions extends SharedPackOptions {}
/**
 * Packs the given directory with the `--json` flag and returns its stdout as JSON.
 *
 * NOTE: Does not work in pnpm <9.14.1 and bun as they don't support the `--json` flag.
 */
export function packAsJson(dir: string, opts?: PackAsJsonOptions): Promise<any>

export interface TarballFile {
  name: string
  data: Uint8Array
}

export interface UnpackResult {
  /**
   * The packed files. Usually with names like "package/src/index.js".
   */
  files: TarballFile[]
  /**
   * The root/shared directory among all packed files, e.g. "package".
   *
   * Usually npm-packed tarball uses "package" as the root directory,
   * however some publishes, like from `@types/*` have different root
   * directories instead. This field helps to identify it.
   */
  rootDir: string
}
/**
 * Unpacks the given tarball buffer.
 */
export function unpack(tarball: ArrayBuffer): Promise<UnpackResult>
