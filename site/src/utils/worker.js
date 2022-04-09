import { inflate } from 'pako'
import untar from 'js-untar'
import { publint } from 'publint'

self.addEventListener('message', async (e) => {
  const { npmPkgName, npmPkgVersion } = e.data

  // prettier-ignore
  const tarballUrl = `${import.meta.env.VITE_NPM_REGISTRY}/${npmPkgName}/-/${npmPkgName}-${npmPkgVersion}.tgz`

  // Credit: https://stackoverflow.com/a/65448758
  const result = await fetch(tarballUrl)
  const resultBuffer = await result.arrayBuffer()
  const tarBuffer = inflate(resultBuffer).buffer // Handles gzip (gz)
  const files = await untar(tarBuffer) // Handles tar (t)

  const messages = await publint({
    pkgDir: 'package', // The tar file names have appended "package"
    vfs: {
      getDirName: (path) => path.replace(/\/[^/]*$/, ''),
      getExtName: (path) => path.replace(/^.*\./, ''),
      isPathDir: (path) => files.some((file) => file.name.startsWith(path)),
      isPathExist: (path) => files.some((file) => file.name === path),
      pathJoin: (...parts) => parts.join('/'),
      pathRelative: (from, to) => to.replace(from, ''),
      pathResolve: (...parts) => parts.join('/'),
      readDir: (path) =>
        files
          .filter((file) => file.name.startsWith(path))
          .map((file) => file.name),
      readFile: (path) => {
        const file = files.find((file) => file.name === path)
        if (file) {
          return new TextDecoder('utf-8').decode(file.buffer)
        } else {
          return ''
        }
      }
    }
  })

  postMessage(messages)
})
