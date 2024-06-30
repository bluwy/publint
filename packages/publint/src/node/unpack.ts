import path from 'node:path'
import { promisify } from 'node:util'
import zlib from 'node:zlib'
import type { TarballFile } from '../shared/types.js'
import { untar } from '../shared/untar.js'
import { getTarballRoot } from '../shared/utils.js'

const gunzip = promisify(zlib.gunzip)

export async function unpack(tarball: ArrayBuffer) {
  // Handle gzip (gz)
  const tarBuffer = await gunzip(tarball)
  // Handle tar (t)
  const files = untar(tarBuffer.buffer)
  return files as TarballFile[]
}

export function rewriteTarballFilePaths(files: TarballFile[], root: string) {
  const tarballRoot = getTarballRoot(files) + '/'
  for (const file of files) {
    // Map file paths back relative to root, make sure slashes are normalized to the OS too
    file.name = path.resolve(root, file.name.slice(tarballRoot.length))
  }
}
