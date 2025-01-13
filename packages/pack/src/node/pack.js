import cp from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'

/** @type {import('../index.d.ts').pack} */
export async function pack(dir, opts) {
  const packageManager = opts?.packageManager ?? 'npm'

  let command = `${packageManager} pack`
  if (packageManager === 'bun') {
    command = command.replace('bun', 'bun pm')
  }

  // Handle tarball output
  const packDestination = opts?.destination ?? dir
  if (opts?.destination) {
    switch (packageManager) {
      case 'yarn':
        command += ` --out \"${path.join(packDestination, 'package.tgz')}\"`
        break
      case 'bun':
        command += ` --destination \"${packDestination}\"`
        break
      default:
        command += ` --pack-destination \"${packDestination}\"`
        break
    }
  }

  // Handle ignore-scripts
  if (opts?.ignoreScripts) {
    switch (packageManager) {
      case 'pnpm':
        command += ' --config.ignore-scripts=true'
        break
      case 'yarn':
        // yarn does not support ignoring scripts
        break
      default:
        command += ' --ignore-scripts'
        break
    }
  }

  const output = await util.promisify(cp.exec)(command, { cwd: dir })

  // Get first file that ends with `.tgz` in the pack destination.
  // Also double-check against stdout as usually the package manager also prints
  // the tarball file name there, in case the directory has existing tarballs.
  const tarballFile = await fs.readdir(packDestination).then((files) => {
    return files.find(
      (file) => file.endsWith('.tgz') && output.stdout.includes(file),
    )
  })
  if (!tarballFile) {
    throw new Error(
      `Failed to find packed tarball file in ${packDestination}. Command output:\n${JSON.stringify(output, null, 2)}`,
    )
  }

  return path.join(packDestination, tarballFile)
}
