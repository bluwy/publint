import util from 'node:util'
import cp from 'node:child_process'

/**
 * @param {string} dir
 * @param {'npm' | 'yarn' | 'pnpm'} packageManager
 * @returns {Promise<string[]>}
 */
export async function packlistWithJson(dir, packageManager) {
  const command = `${packageManager} pack --json`

  const { stdout } = await util.promisify(cp.exec)(command, { cwd: dir })

  const stdoutJson =
    packageManager === 'yarn' ? jsonParseYarnStdout(stdout) : JSON.parse(stdout)

  switch (packageManager) {
    case 'npm':
      return parseNpmPackJson(stdoutJson)
    case 'yarn':
      return parseYarnPackJson(stdoutJson)
    case 'pnpm':
      return parsePnpmPackJson(stdoutJson)
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
