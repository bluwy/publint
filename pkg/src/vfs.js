import fsp from 'fs/promises'
import path from 'path'

/**
 * @typedef {{
 *   readFile: (path: string) => Promise<string>,
 *   readDir: (path: string) => Promise<string[]>,
 *   isPathDir: (path: string) => Promise<boolean>,
 *   pathJoin: (...paths: string[]) => string,
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
    pathJoin(...parts) {
      return path.join(...parts)
    }
  }
}
