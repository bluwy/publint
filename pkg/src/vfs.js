import fs from 'node:fs'
import fsp from 'node:fs/promises'
import nodePath from 'node:path'

/**
 * Creates a node-compatible Vfs object
 * @returns {import('..').Vfs}
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
      try {
        return (await fsp.stat(path)).isDirectory()
      } catch {
        return false
      }
    },
    async isPathExist(path) {
      return fs.existsSync(path)
    },
    // TODO: Manually create these
    pathJoin(...parts) {
      return nodePath.join(...parts)
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
