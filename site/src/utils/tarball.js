/** @typedef {{ name: string, buffer: ArrayBuffer }} TarballFile */

/**
 * @param {TarballFile[]} files
 * @return {import('publint').Vfs}
 * */
export function createTarballVfs(files) {
  return {
    getDirName: (path) => path.replace(/\/[^/]*$/, ''),
    getExtName: (path) => path.replace(/^.*\./, '.'),
    isPathDir: async (path) => {
      path = path.endsWith('/') ? path : path + '/'
      return files.some((file) => file.name.startsWith(path))
    },
    isPathExist: async (path) => files.some((file) => file.name === path),
    pathJoin: (...parts) =>
      parts
        .map((v) => (v.startsWith('./') ? v.slice(2) : v))
        .join('/')
        .replace('///', '/')
        .replace('//', '/'), // TODO: optimize this please
    pathRelative: (from, to) => to.replace(from, '').slice(1),
    readDir: async (path) => {
      path = path.endsWith('/') ? path : path + '/'
      return files
        .filter((file) => file.name.startsWith(path) && file.name !== path)
        .map((file) => file.name.slice(path.length))
    },
    readFile: async (path) => {
      const file = files.find((file) => file.name === path)
      if (file) {
        return new TextDecoder('utf-8').decode(file.buffer)
      } else {
        throw new Error(`Unable to read file at path: ${path}`)
      }
    }
  }
}
