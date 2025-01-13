import fs from 'node:fs/promises'
import { pack } from './pack.js'
import { packAsJson } from './pack-as-json.js'
import { unpack } from './unpack.js'
import { getTempPackDir } from './utils.js'

/** @type {import('../index.d.ts').packAsList} */
export async function packAsList(dir, opts) {
  const packageManager = opts?.packageManager ?? 'npm'

  // TODO: Maybe fast path to `packAsListWithPack` for package managers that do not support `--json`
  try {
    return await packAsListWithJson(dir, packageManager, opts?.ignoreScripts)
  } catch {
    return await packAsListWithPack(dir, packageManager, opts?.ignoreScripts)
  }
}

/**
 * NOTE: only exported for tests
 * @internal
 * @param {string} dir
 * @param {NonNullable<import('../index.d.ts').PackAsListOptions['packageManager']>} packageManager
 * @param {import('../index.d.ts').PackAsListOptions['ignoreScripts']} ignoreScripts
 * @returns {Promise<string[]>}
 */
export async function packAsListWithJson(dir, packageManager, ignoreScripts) {
  const stdoutJson = await packAsJson(dir, { packageManager, ignoreScripts })
  switch (packageManager) {
    case 'npm':
      return parseNpmPackJson(stdoutJson)
    case 'yarn':
      return parseYarnPackJson(stdoutJson)
    case 'pnpm':
      return parsePnpmPackJson(stdoutJson)
    default:
      return []
  }
}

/**
 * NOTE: only exported for tests
 * @internal
 * @param {string} dir
 * @param {NonNullable<import('../index.d.ts').PackAsListOptions['packageManager']>} packageManager
 * @param {import('../index.d.ts').PackAsListOptions['ignoreScripts']} ignoreScripts
 * @returns {Promise<string[]>}
 */
export async function packAsListWithPack(dir, packageManager, ignoreScripts) {
  const destination = await getTempPackDir()
  const tarballPath = await pack(dir, {
    packageManager,
    ignoreScripts,
    destination,
  })

  try {
    const buffer = /** @type {ArrayBuffer} */ (
      (await fs.readFile(tarballPath)).buffer
    )
    const { files, rootDir } = await unpack(buffer)
    return files.map((file) => file.name.slice(rootDir.length + 1))
  } finally {
    await fs.rm(destination, { recursive: true })
  }
}

/**
 * @param {any} stdoutJson
 * @returns {string[]}
 */
function parseNpmPackJson(stdoutJson) {
  return stdoutJson[0].files.map((/** @type {any} */ file) => file.path)
}

/**
 * @param {any} stdoutJson
 * @returns {string[]}
 */
function parseYarnPackJson(stdoutJson) {
  const files = []
  for (const value of stdoutJson) {
    if (value.location) files.push(value.location)
  }
  return files
}

/**
 * @param {any} stdoutJson
 * @returns {string[]}
 */
function parsePnpmPackJson(stdoutJson) {
  return stdoutJson.files.map((/** @type {any} */ file) => file.path)
}
