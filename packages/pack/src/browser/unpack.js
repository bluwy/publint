import {
  arrayBufferToReadableStream,
  readableStreamToArrayBuffer
} from '../shared/buffer-stream.js'
import { getFilesRootDir, parseTar } from '../shared/parse-tar.js'

/** @type {import('../index.d.ts').unpack} */
export function unpack(tarball) {
  const stream = arrayBufferToReadableStream(tarball)
  const buffer = readableStreamToArrayBuffer(
    stream.pipeThrough(new DecompressionStream('gzip'))
  )
  const files = parseTar(buffer)
  const rootDir = getFilesRootDir(files)
  return { files, rootDir }
}
