import fs from 'node:fs'
import fsp from 'node:fs/promises'
import nodePath from 'node:path'

/**
 * @typedef {{
 *   readFile: (path: string) => Promise<string>,
 *   readDir: (path: string) => Promise<string[]>,
 *   isPathDir: (path: string) => Promise<boolean>,
 *   isPathExist: (path: string) => Promise<boolean>,
 *   pathJoin: (...paths: string[]) => string,
 *   pathResolve: (...paths: string[]) => string,
 *   pathRelative: (from: string, to: string) => string,
 *   getDirName: (path: string) => string,
 *   getExtName: (path: string) => string,
 * }} Vfs
 */

/**
 * @returns {Vfs}
 */
export function createNodeVfs() {
  return {
    async readFile(path) {
      return await fsp.readFile(path, 'utf8')
    },
    async readDir(path) {
      return await fsp.readdir(path)
    },
    async isPathDir(path) {
      return (await fsp.stat(path)).isDirectory()
    },
    async isPathExist(path) {
      return fs.existsSync(path)
    },
    // TODO: Manually create these
    pathJoin(...parts) {
      return nodePath.join(...parts)
    },
    pathResolve(...parts) {
      return nodePath.resolve(...parts)
    },
    pathRelative(from, to) {
      return nodePath.relative(from, to)
    },
    getDirName(path) {
      return nodePath.dirname(path)
    },
    getExtName(path) {
      return nodePath.extname(path)
    }
  }
}
