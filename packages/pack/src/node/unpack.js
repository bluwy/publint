import util from 'node:util'
import zlib from 'node:zlib'
import { getFilesRootDir, parseTar } from '../shared/parse-tar.js'

/** @type {import('../index.d.ts').unpack} */
export async function unpack(tarball) {
  const nodeBuffer = await util.promisify(zlib.gunzip)(tarball)
  const files = parseTar(nodeBuffer.buffer)
  const rootDir = getFilesRootDir(files)
  return { files, rootDir }
}
