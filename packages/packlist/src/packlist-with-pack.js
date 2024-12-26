import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'
import os from 'node:os'
import cp from 'node:child_process'
import zlib from 'node:zlib'

/**
 * @param {string} dir
 * @param {'npm' | 'yarn' | 'pnpm'} packageManager
 * @returns {Promise<string[]>}
 */
export async function packlistWithPack(dir, packageManager) {
  let command = `${packageManager} pack`

  // TODO: handle space in directory
  const packDestination = await getTempPackDir()

  if (packageManager === 'yarn') {
    command += ` --out ${path.join(packDestination, 'package.tgz')}`
  } else {
    command += ` --pack-destination ${packDestination}`
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

  return await unpack(tarballFile)
}

async function unpack(tarballFile) {
  const tarball = await fs.readFile(tarballFile)
  const content = await util.promisify(zlib.gunzip)(tarball)

  /** @type {string[]} */
  const fileNames = []

  let offset = 0
  while (offset < content.length) {
    // Skip empty blocks at end
    if (content.slice(offset, offset + 512).every((byte) => byte === 0)) break

    // Read filename from header (100 bytes max)
    const name = content
      .slice(offset, offset + 100)
      .toString('ascii')
      .split('\0')[0]

    if (name) fileNames.push(name)

    // Get file size from header (12 bytes octal at offset 124)
    const size = parseInt(
      content
        .slice(offset + 124, offset + 136)
        .toString()
        .trim(),
      8
    )

    // Skip header and file content (padded to 512 bytes)
    offset += 512 + Math.ceil(size / 512) * 512
  }

  return fileNames
}

async function getTempPackDir() {
  const tempDir = os.tmpdir() + path.sep
  const tempPackDir = await fs.mkdtemp(tempDir + 'publint-pack-')
  return await fs.realpath(tempPackDir)
}
