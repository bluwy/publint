import util from 'node:util'
import zlib from 'node:zlib'
import {
  arrayBufferToReadableStream,
  readableStreamToArrayBuffer
} from '../shared/buffer-stream.js'
import { getFilesRootDir, parseTar } from '../shared/parse-tar.js'

/** @type {import('../index.d.ts').unpack} */
export async function unpack(tarball) {
  /** @type {ArrayBuffer} */
  let buffer
  if (tarball instanceof ReadableStream) {
    const readableStream = arrayBufferToReadableStream(tarball)
    buffer = await readableStreamToArrayBuffer(
      readableStream.pipeThrough(new DecompressionStream('gzip'))
    )
  } else {
    const nodeBuffer = await util.promisify(zlib.gunzip)(tarball)
    buffer = nodeBuffer.buffer
  }
  const files = parseTar(buffer)
  const rootDir = getFilesRootDir(files)
  return { files, rootDir }
}
