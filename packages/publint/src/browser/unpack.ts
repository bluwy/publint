// TODO: pako is chonky
import { inflate } from 'pako'
import type { TarballFile } from '../shared/types.js'
import { untar } from '../shared/untar.js'

export async function unpack(tarball: ArrayBuffer) {
  // Handle gzip (gz)
  const tarBuffer = inflate(tarball).buffer
  // Handle tar (t)
  const files = untar(tarBuffer.buffer)
  return files as TarballFile[]
}
