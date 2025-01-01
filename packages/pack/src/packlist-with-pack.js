import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'
import cp from 'node:child_process'
import zlib from 'node:zlib'
import { getTempPackDir } from './temp.js'

/**
 * @param {string} dir
 * @param {NonNullable<import('../index.d.ts').Options['packageManager']>} packageManager
 * @returns {Promise<string[]>}
 */
export async function packlistWithPack(dir, packageManager) {
  let command = `${packageManager} pack`

  const packDestination = await getTempPackDir()

  if (packageManager === 'yarn') {
    command += ` --out \"${path.join(packDestination, 'package.tgz')}\"`
  } else if (packageManager === 'bun') {
    command = command.replace('bun', 'bun pm')
    command += ` --destination \"${packDestination}\"`
  } else {
    command += ` --pack-destination \"${packDestination}\"`
  }

  const output = await util.promisify(cp.exec)(command, { cwd: dir })

  // Get first file that ends with `.tgz` in the pack destination
  const tarballFile = await fs.readdir(packDestination).then((files) => {
    return files.find((file) => file.endsWith('.tgz'))
  })
  if (!tarballFile) {
    throw new Error(
      `[publint] Failed to find packed tarball file in ${packDestination}\n${JSON.stringify(output, null, 2)}`
    )
  }

  try {
    const files = await unpack(path.join(packDestination, tarballFile))
    // The tar file names have appended "package", except for `@types` packages very strangely
    const pkgDir = files.length ? files[0].split('/')[0] : 'package'
    return files.map((file) => file.slice(pkgDir.length + 1))
  } finally {
    await fs.rm(packDestination, { recursive: true })
  }
}

/**
 * @param {string} tarballFile
 */
async function unpack(tarballFile) {
  const tarball = await fs.readFile(tarballFile)
  const content = await util.promisify(zlib.gunzip)(tarball)

  /** @type {string[]} */
  const fileNames = []

  let offset = 0
  while (offset < content.length) {
    // Get file type from header (from offset 156, 1 byte)
    const type = content.subarray(offset + 156, offset + 157).toString()

    // Skip empty blocks at end
    if (type === '\0') break

    // Only handle files (0). Packed packages often only contain files and no directories.
    // It may contain PAX headers (x) and global PAX headers (g), but we don't need to handle those.
    if (type === '0') {
      // Get file name from header (from offset 0, 100 bytes)
      const name = content
        .subarray(offset, offset + 100)
        .toString()
        .split('\0', 1)[0]

      fileNames.push(name)
    }

    // Get file size from header (from offset 124, 12 bytes)
    const size = parseInt(
      content.subarray(offset + 124, offset + 136).toString(),
      8
    )

    // Skip header and file content (padded to 512 bytes)
    offset += 512 + Math.ceil(size / 512) * 512
  }

  return fileNames
}
