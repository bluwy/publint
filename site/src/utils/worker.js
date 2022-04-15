import { inflate } from 'pako'
import { publint } from 'publint'
import { isLocalPkg } from './common'
import { untar } from './untar'

self.addEventListener('message', async (e) => {
  const { npmPkgName, npmPkgVersion } = e.data

  let tarballUrl
  if (isLocalPkg(npmPkgName)) {
    // prettier-ignore
    tarballUrl = new URL(`/temp/${npmPkgName}-${npmPkgVersion}.tgz`, import.meta.url).href
  } else {
    // prettier-ignore
    tarballUrl = `${import.meta.env.VITE_NPM_REGISTRY}/${npmPkgName}/-/${npmPkgName}-${npmPkgVersion}.tgz`
  }

  // Credit: https://stackoverflow.com/a/65448758
  const result = await fetch(tarballUrl)
  const resultBuffer = await result.arrayBuffer()
  const tarBuffer = inflate(resultBuffer).buffer // Handles gzip (gz)
  const files = untar(tarBuffer) // Handles tar (t)

  /** @type {import('publint').Vfs} */
  const vfs = {
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
        throw new Error('Unable to read file at path:', path)
      }
    }
  }

  // The tar file names have appended "package"
  const messages = await publint({ pkgDir: 'package', vfs })
  const pkgJson = JSON.parse(await vfs.readFile('package/package.json'))

  postMessage({
    messages,
    pkgJson
  })
})
