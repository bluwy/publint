import { publint } from 'publint'
import { unpackTarball } from 'publint/utils'
import getNpmTarballUrl from 'get-npm-tarball-url'
import { isLocalPkg } from './common'

self.addEventListener('message', async (e) => {
  const { npmPkgName, npmPkgVersion, isPkgPrNew } = e.data

  let tarballUrl
  if (isLocalPkg(npmPkgName)) {
    // prettier-ignore
    tarballUrl = new URL(`/temp/${npmPkgName}-${npmPkgVersion}.tgz`, self.location.href).href
  } else if (isPkgPrNew) {
    tarballUrl = `https://pkg.pr.new/${npmPkgName}@${npmPkgVersion}`
  } else {
    // prettier-ignore
    tarballUrl = getNpmTarballUrl(npmPkgName, npmPkgVersion, {
      registry: import.meta.env.VITE_NPM_REGISTRY
    })
  }

  // Unpack flow credit: https://stackoverflow.com/a/65448758

  postMessage({ type: 'status', data: 'Fetching package...' })
  /** @type {Response} */
  let response
  try {
    response = await fetch(tarballUrl)
  } catch (e) {
    postMessage({ type: 'error', data: 'Package not found' })
    console.error(e)
    return
  }

  if (response.body == null) {
    postMessage({ type: 'error', data: 'Package response has no body' })
    return
  }

  postMessage({ type: 'status', data: 'Unpacking package...' })
  /** @type {import('publint/utils').TarballFile[]} */
  let files
  /** @type {string} */
  let pkgDir
  try {
    const buffer = await new Response(
      response.body.pipeThrough(new DecompressionStream('gzip'))
    ).arrayBuffer()
    const result = await unpackTarball(buffer)
    files = result.files
    pkgDir = result.rootDir
  } catch (e) {
    postMessage({ type: 'error', data: 'Failed to unpack package' })
    console.error(e)
    return
  }

  postMessage({ type: 'status', data: 'Linting package...' })
  /** @type {import('publint').Message[]} */
  let messages
  /** @type {Record<string, any>} */
  let pkgJson
  try {
    const result = await publint({ pkgDir, pack: { files } })
    messages = result.messages

    const pkgJsonFile = files.find((f) => f.name === pkgDir + '/package.json')
    pkgJson = JSON.parse(new TextDecoder().decode(pkgJsonFile?.data))
  } catch (e) {
    postMessage({ type: 'error', data: 'Failed to lint package' })
    console.error(e)
    return
  }

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
