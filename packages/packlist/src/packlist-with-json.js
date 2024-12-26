import utils from 'node:util'
import cp from 'node:child_process'

/**
 * @param {string} dir
 * @param {'npm' | 'yarn' | 'pnpm'} packageManager
 * @returns {Promise<string[]>}
 */
export async function packlistWithJson(dir, packageManager) {
  const command = `${packageManager} pack --json`

  const { stdout } = await utils.promisify(cp.exec)(command, { cwd: dir })

  // yarn outputs invalid json for some reason
  const stdoutJson =
    packageManager === 'yarn'
      ? stdout.split('\n').map((line) => JSON.parse(line))
      : JSON.parse(stdout)

  switch (packageManager) {
    case 'npm':
      return parseNpmPackJson(stdoutJson)
    case 'yarn':
      return parseYarnPackJson(stdoutJson)
    case 'pnpm':
      return parsePnpmPackJson(stdoutJson)
  }
}

function parseNpmPackJson(stdoutJson) {
  return stdoutJson[0].files.map((file) => file.path)
}

function parseYarnPackJson(stdoutJson) {
  const files = []
  for (const value in stdoutJson) {
    if (value.location) files.push(value.location)
  }
  return files
}

function parsePnpmPackJson(stdoutJson) {
  return stdoutJson.files.map((file) => file.path)
}
