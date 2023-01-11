import { inflate } from 'pako'
import { publint } from 'publint'
import getNpmTarballUrl from 'get-npm-tarball-url'
import { isLocalPkg } from './common'
import { untar } from './untar'

self.addEventListener('message', async (e) => {
  const { npmPkgName, npmPkgVersion } = e.data

  let tarballUrl
  if (isLocalPkg(npmPkgName)) {
    // prettier-ignore
    tarballUrl = new URL(`/temp/${npmPkgName}-${npmPkgVersion}.tgz`, self.location).href
  } else {
    // prettier-ignore
    tarballUrl = getNpmTarballUrl(npmPkgName, npmPkgVersion, {
      registry: import.meta.env.VITE_NPM_REGISTRY
    })
  }

  // Unpack flow credit: https://stackoverflow.com/a/65448758

  postMessage({ type: 'status', data: 'Fetching package...' })
  /** @type {ArrayBuffer} */
  let resultBuffer
  try {
    const result = await fetch(tarballUrl)
    resultBuffer = await result.arrayBuffer()
  } catch (e) {
    postMessage({ type: 'error', data: 'Package not found' })
    console.error(e)
    return
  }

  postMessage({ type: 'status', data: 'Unpacking package...' })
  /** @type {{ name: string, buffer: ArrayBuffer }[]} */
  let files
  try {
    const tarBuffer = inflate(resultBuffer).buffer // Handles gzip (gz)
    files = untar(tarBuffer) // Handles tar (t)
  } catch (e) {
    postMessage({ type: 'error', data: 'Failed to unpack package' })
    console.error(e)
    return
  }

  /** @type {import('publint').Vfs} */
  const vfs = {
    getDirName: (path) => path.replace(/\/[^/]*$/, ''),
    getExtName: (path) => path.replace(/^.*\./, ''),
    isPathDir: (path) =>
      files.some((file) => file.name.startsWith(path) && file.name !== path),
    isPathExist: (path) => files.some((file) => file.name === path),
    pathJoin: (...parts) =>
      parts
        .map((v) => (v.startsWith('./') ? v.slice(2) : v))
        .join('/')
        .replace('///', '/')
        .replace('//', '/'), // TODO: optimize this please
    pathRelative: (from, to) => to.replace(from, '').slice(1),
    readDir: (path) => {
      path = path.endsWith('/') ? path : path + '/'
      return files
        .filter((file) => file.name.startsWith(path))
        .map((file) => file.name.slice(path.length))
    },
    readFile: (path) => {
      const file = files.find((file) => file.name === path)
      if (file) {
        return new TextDecoder('utf-8').decode(file.buffer)
      } else {
        throw new Error(`Unable to read file at path: ${path}`)
      }
    }
  }

  postMessage({ type: 'status', data: 'Linting package...' })
  // The tar file names have appended "package"
  const messages = await publint({ pkgDir: 'package', vfs })
  const pkgJson = JSON.parse(await vfs.readFile('package/package.json'))

  postMessage({
    type: 'result',
    data: {
      messages,
      pkgJson
    }
  })
})

self.addEventListener('unhandledrejection', () => {
  postMessage({ type: 'error' })
})
