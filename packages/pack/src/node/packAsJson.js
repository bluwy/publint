import cp from 'node:child_process'
import fs from 'node:fs/promises'
import util from 'node:util'
import { getTempPackDir } from './utils.js'

/** @type {import('../index.d.ts').packAsJson} */
export async function packAsJson(dir, opts) {
  const packageManager = opts?.packageManager ?? 'npm'
  if (packageManager === 'bun') {
    throw new Error('`packAsJson` is not supported for `bun`')
  }

  let command = `${packageManager} pack --json`

  const supportsDryRun = packageManager === 'npm' || packageManager === 'yarn'
  /** @type {string | undefined} */
  let packDestination
  if (supportsDryRun) {
    command += ' --dry-run'
  } else {
    // For package managers that don't support `--dry-run`, we need to pack to a temporary directory
    // and delete it later
    packDestination = await getTempPackDir()
    command += ` --pack-destination ${packDestination}`
  }

  const { stdout } = await util.promisify(cp.exec)(command, { cwd: dir })

  try {
    return JSON.parse(
      packageManager === 'yarn' ? fixYarnStdout(stdout) : stdout
    )
  } finally {
    if (!supportsDryRun && packDestination) {
      await fs.rm(packDestination, { recursive: true })
    }
  }
}

// yarn outputs invalid json for some reason
function fixYarnStdout(stdout) {
  const lines = stdout.split('\n')
  // Combine lines as arrays
  let fixedStdout = '['
  for (const line of lines) {
    if (line) fixedStdout += line + ','
  }
  // Remove trailing slash
  if (fixedStdout[fixedStdout.length - 1] === ',') {
    fixedStdout = fixedStdout.slice(0, -1)
  }
  fixedStdout += ']'
  return result
}
