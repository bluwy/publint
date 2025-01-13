import util from 'node:util'
import zlib from 'node:zlib'
import { readableStreamToArrayBuffer } from '../shared/buffer-stream.js'
import { getFilesRootDir, parseTar } from '../shared/parse-tar.js'

/** @type {import('../index.d.ts').unpack} */
export async function unpack(tarball) {
  /** @type {ArrayBuffer} */
  let buffer
  if (tarball instanceof ReadableStream) {
    buffer = await readableStreamToArrayBuffer(
      tarball.pipeThrough(new DecompressionStream('gzip')),
    )
  } else {
    const nodeBuffer = await util.promisify(zlib.gunzip)(tarball)
    buffer = /** @type {ArrayBuffer} */ (nodeBuffer.buffer)
  }
  const files = parseTar(buffer)
  const rootDir = getFilesRootDir(files)
  return { files, rootDir }
}
