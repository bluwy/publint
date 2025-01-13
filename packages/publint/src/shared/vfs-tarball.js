/**
 * @param {import("../index.d.ts").PackFile[]} files
 * @return {import("./core.js").Vfs}
 * */
export function createTarballVfs(files) {
  /** @type {TextDecoder | undefined} */
  let decoder

  return {
    getDirName: (path) => path.replace(/\/[^/]*$/, ''),
    getExtName: (path) => path.replace(/^.*\./, '.'),
    isPathDir: async (path) => {
      path = path.endsWith('/') ? path : path + '/'
      return files.some((file) => file.name.startsWith(path))
    },
    isPathExist: async (path) => {
      const pathDirVariant = path.endsWith('/') ? path : path + '/'
      return files.some(
        (file) => file.name === path || file.name.startsWith(pathDirVariant),
      )
    },
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
      if (!file) throw new Error(`Unable to read file at path: ${path}`)
      if (typeof file.data === 'string') {
        return file.data
      } else {
        decoder ??= new TextDecoder()
        return decoder.decode(file.data)
      }
    },
  }
}
