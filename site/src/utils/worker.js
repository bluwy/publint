import { inflate } from 'pako'
import { publint } from 'publint'
import getNpmTarballUrl from 'get-npm-tarball-url'
import { isLocalPkg } from './common'
import { untar } from './untar'
import { createTarballVfs } from './tarball'

self.addEventListener('message', async (e) => {
  const { npmPkgName, npmPkgVersion } = e.data

  let tarballUrl
  if (isLocalPkg(npmPkgName)) {
    // prettier-ignore
    tarballUrl = new URL(`/temp/${npmPkgName}-${npmPkgVersion}.tgz`, self.location.href).href
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
  /** @type {import('./tarball').TarballFile[]} */
  let files
  try {
    const tarBuffer = inflate(resultBuffer).buffer // Handles gzip (gz)
    files = untar(tarBuffer) // Handles tar (t)
  } catch (e) {
    postMessage({ type: 'error', data: 'Failed to unpack package' })
    console.error(e)
    return
  }
  const vfs = createTarballVfs(files)

  postMessage({ type: 'status', data: 'Linting package...' })
  // The tar file names have appended "package", except for `@types` packages very strangely
  const pkgDir = files.length ? files[0].name.split('/')[0] : 'package'
  const { messages } = await publint({ pkgDir, vfs })
  const pkgJson = JSON.parse(await vfs.readFile(pkgDir + '/package.json'))

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
