import c from 'picocolors'
import type { Options, TarballFile } from './types.js'

export function warn(message: string) {
  console.warn(c.yellow(`[publint] ${message}`))
}

export function resolvePlugins(plugins: Options['plugins'] = []) {
  // @ts-expect-error Ignore `Type instantiation is excessively deep and possibly infinite` due to flatten
  return plugins.flat(Infinity).filter(Boolean)
}

export function getTarballPkgJson(tarballFiles: TarballFile[]) {
  const root = getTarballRoot(tarballFiles)
  const file = tarballFiles.find((f) => f.name === `${root}/package.json`)
  if (!file) {
    throw new Error('package.json not found in tarball')
  }
  const pkgJsonContent = new TextDecoder('utf-8').decode(file.buffer)
  return JSON.parse(pkgJsonContent)
}

export function getTarballRoot(tarballFiles: TarballFile[]) {
  return tarballFiles.length ? tarballFiles[0].name.split('/')[0] : 'package'
}
