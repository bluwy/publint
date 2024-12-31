import fss from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import getNpmTarballUrl from 'get-npm-tarball-url'
import { npmHighImpact } from 'npm-high-impact'
import { publint } from 'publint'
import pLimit from 'p-limit'

/*
  Results enum (severity):
  0: No issues
  1: Has suggestions
  2: Has warnings
  3: Has errors
*/

const cachedResultsFileUrl = new URL('./cache/_results.json', import.meta.url)
const usedCacheFileBaseNames = ['_results.json']
const useCacheOnly = process.argv.includes('--cache')

try {
  await fs.mkdir('./cache', { recursive: true })
  if (process.argv.includes('--bench')) {
    await benchCommand()
  } else {
    await mainCommand()
  }
} catch (e) {
  console.error(e)
  process.exitCode = 1
} finally {
  // cleanup unused cache
  const cachedFiles = await fs.readdir('./cache')
  await Promise.all(
    cachedFiles.map(async (file) => {
      if (!usedCacheFileBaseNames.includes(file)) {
        await fs.rm(new URL(`./cache/${file}`, import.meta.url))
      }
    })
  )
}

async function mainCommand() {
  const packages = npmHighImpact.slice(0, 200)
  const limit = pLimit(5)
  const processed = await Promise.all(
    packages.map((pkg) =>
      limit(async () => {
        try {
          const pkgData = await fetchPkgData(pkg)
          if (!pkgData) {
            console.log('No data for', pkg)
            return null
          }
          const { tarball, version } = pkgData
          const { messages } = await publint({ pack: { tarball } })
          const severity =
            messages.length === 0
              ? 0
              : Math.max(...messages.map((m) => messageToSeverity(m)))

          // Provide feedback
          console.log(pkg, severity)

          return { version, severity }
        } catch (e) {
          console.error(`Failed to lint ${pkg}`, e)
          return null
        }
      })
    )
  )

  const result = {}
  for (let i = 0; i < packages.length; i++) {
    const p = processed[i]
    if (p) {
      result[`${packages[i]}@${p.version}`] = p.severity
    }
  }
  await fs.writeFile(cachedResultsFileUrl, JSON.stringify(result, null, 2))
}

async function benchCommand() {
  console.log('Fetching packages...')
  const packages = npmHighImpact.slice(0, 200)
  const limit = pLimit(5)
  const pkgData = await Promise.all(
    packages.map((pkg) =>
      limit(async () => {
        try {
          const data = await fetchPkgData(pkg)
          if (!data) {
            console.log('No data for', pkg)
            return null
          }
          return { ...data, pkg }
        } catch (e) {
          console.error(`Failed to fetch ${pkg}`, e)
          return null
        }
      })
    )
  )

  console.log('Linting packages...')
  const start = performance.now()
  await Promise.all(
    pkgData.map((d) =>
      limit(async () => {
        if (!d) return
        try {
          const { tarball } = d
          await publint({ pack: { tarball } })
        } catch (e) {
          console.error(`Failed to lint ${d.pkg}`, e)
          return null
        }
      })
    )
  )
  const duration = performance.now() - start

  console.log(`Linted ${packages.length} packages in ${duration.toFixed(2)}ms`)
}

/**
 * @param {string} pkg
 */
async function fetchPkgData(pkg) {
  const version = useCacheOnly
    ? await getPkgVersionFromCache(pkg)
    : await fetchPkgLatestVersion(pkg)
  if (!version) return null

  const cachedFileUrl = getCacheTarFileUrl(pkg, version)
  usedCacheFileBaseNames.push(path.basename(cachedFileUrl.href))

  /** @type {ArrayBuffer} */
  let tarball

  if (fss.existsSync(cachedFileUrl)) {
    const buffer = (await fs.readFile(cachedFileUrl)).buffer
    if (buffer instanceof ArrayBuffer) {
      tarball = buffer
    } else {
      throw new Error(`Unexpected SharedArrayBuffer type for ${cachedFileUrl}`)
    }
  } else if (!useCacheOnly) {
    tarball = await fetchPkg(pkg, version)
    await fs.writeFile(cachedFileUrl, Buffer.from(tarball))
  } else {
    return null
  }

  return { tarball, version }
}

/**
 * @param {string} pkg
 * @param {string} version
 */
function getCacheTarFileUrl(pkg, version) {
  return new URL(
    `./cache/${pkg.replace('/', '__')}-${version}.tgz`,
    import.meta.url
  )
}

/**
 * @param {string} pkg
 * @param {string} version
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchPkg(pkg, version) {
  const tarballUrl = getNpmTarballUrl(pkg, version)
  const fetchResult = await fetch(tarballUrl, {
    headers: {
      'User-Agent': 'publint-analysis'
    }
  })
  return await fetchResult.arrayBuffer()
}

/**
 * @param {string} pkg
 * @returns {Promise<string>}
 */
async function fetchPkgLatestVersion(pkg) {
  return await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`,
    {
      headers: {
        'User-Agent': 'publint-analysis'
      }
    }
  )
    .then((v) => v.ok && v.json())
    .then((v) => v.version)
}

async function getPkgVersionFromCache(pkg) {
  const cachedFiles = await fs.readdir('./cache')
  const pkgName = pkg.replace('/', '__')
  for (const file of cachedFiles) {
    if (file.startsWith(pkgName)) {
      return /-(\d.*)\.tgz/.exec(file)?.[1]
    }
  }
}

/**
 * @param {import('publint').Message} message
 */
function messageToSeverity(message) {
  switch (message.type) {
    case 'error':
      return 3
    case 'warning':
      return 2
    case 'suggestion':
      return 1
  }
}
