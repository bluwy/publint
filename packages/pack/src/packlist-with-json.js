import fs from 'node:fs/promises'
import util from 'node:util'
import cp from 'node:child_process'
import { getTempPackDir } from './temp.js'

/**
 * @param {string} dir
 * @param {NonNullable<import('../index.d.ts').Options['packageManager']>} packageManager
 * @returns {Promise<string[]>}
 */
export async function packlistWithJson(dir, packageManager) {
  if (packageManager === 'bun') {
    throw new Error('`packlistWithJson` is not supported for `bun`')
  }

  let command = `${packageManager} pack --json`

  const supportsDryRun = packageManager === 'npm' || packageManager === 'yarn'
  /** @type {string | undefined} */
  let packDestination
  if (supportsDryRun) {
    command += ' --dry-run'
  } else {
    packDestination = await getTempPackDir()
    command += ` --pack-destination ${packDestination}`
  }

  const { stdout } = await util.promisify(cp.exec)(command, { cwd: dir })

  try {
    const stdoutJson =
      packageManager === 'yarn'
        ? jsonParseYarnStdout(stdout)
        : JSON.parse(stdout)

    switch (packageManager) {
      case 'npm':
        return parseNpmPackJson(stdoutJson)
      case 'yarn':
        return parseYarnPackJson(stdoutJson)
      case 'pnpm':
        return parsePnpmPackJson(stdoutJson)
    }
  } finally {
    if (!supportsDryRun && packDestination) {
      await fs.rm(packDestination, { recursive: true })
    }
  }
}

// yarn outputs invalid json for some reason
function jsonParseYarnStdout(stdout) {
  const lines = stdout.split('\n')
  const result = []
  for (const line of lines) {
    if (line) result.push(JSON.parse(line))
  }
  return result
}

function parseNpmPackJson(stdoutJson) {
  return stdoutJson[0].files.map((file) => file.path)
}

function parseYarnPackJson(stdoutJson) {
  const files = []
  for (const value of stdoutJson) {
    if (value.location) files.push(value.location)
  }
  return files
}

function parsePnpmPackJson(stdoutJson) {
  return stdoutJson.files.map((file) => file.path)
}
