import { pack } from './pack.js'
import { packAsJson } from './packAsJson.js'
import { unpack } from './unpack.js'
import { getTempPackDir } from './utils.js'

/** @type {import('../index.d.ts').packAsList} */
export async function packAsList(dir, opts) {
  const packageManager = opts?.packageManager ?? 'npm'

  // TODO: Maybe fast path to `packlistWithPack` for package managers that do not support `--json`
  try {
    return await packlistWithJson(dir, packageManager)
  } catch {
    return await packlistWithPack(dir, packageManager)
  }
}

/**
 * NOTE: only exported for tests
 * @internal
 * @param {string} dir
 * @param {NonNullable<import('../index.d.ts').PackAsListOptions['packageManager']>} packageManager
 * @returns {Promise<string[]>}
 */
export async function packAsListWithJson(dir, packageManager) {
  const stdoutJson = await packAsJson(dir, { packageManager })
  switch (packageManager) {
    case 'npm':
      return parseNpmPackJson(stdoutJson)
    case 'yarn':
      return parseYarnPackJson(stdoutJson)
    case 'pnpm':
      return parsePnpmPackJson(stdoutJson)
    // Bun does not support `--json` so no need to handle it here
  }
}

/**
 * NOTE: only exported for tests
 * @internal
 * @param {string} dir
 * @param {NonNullable<import('../index.d.ts').PackAsListOptions['packageManager']>} packageManager
 * @returns {Promise<string[]>}
 */
export async function packAsListWithPack(dir, packageManager) {
  const destination = await getTempPackDir()
  const tarballPath = await pack(dir, { packageManager, destination })

  try {
    const { files, rootDir } = await unpack(tarballPath)
    return files.map((file) => file.slice(rootDir.length + 1))
  } finally {
    await fs.rm(destination, { recursive: true })
  }
}

/**
 * @param {string} stdoutJson
 * @returns {string[]}
 */
function parseNpmPackJson(stdoutJson) {
  return stdoutJson[0].files.map((file) => file.path)
}

/**
 * @param {string} stdoutJson
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
 * @param {string} stdoutJson
 * @returns {string[]}
 */
function parsePnpmPackJson(stdoutJson) {
  return stdoutJson.files.map((file) => file.path)
}
