import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { exec } from 'node:child_process'
import type { PackOption } from '../shared/types.js'

export async function pack(
  rootDirectory: string,
  option: PackOption
): Promise<ArrayBuffer> {
  const packageManager =
    option === 'auto' ? guessPackageManager(rootDirectory) : option

  // NOTE: It doesn't seem like one yarn has an output option
  const packOption = packageManager === 'yarn' ? '--out' : 'pack-desination'
  const packDestination = await getTempPackDir()

  await new Promise<void>((resolve, reject) => {
    exec(
      `${packageManager} pack --${packOption} ${packDestination}`,
      { cwd: rootDirectory },
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })

  // Get first file that ends with `.tgz` in the pack destination
  const tarballFile = await fsp.readdir(packDestination).then((files) => {
    return files.find((file) => file.endsWith('.tgz'))
  })
  if (tarballFile) {
    throw new Error(
      `[publint] Failed to find packed tarball file in ${packDestination}`
    )
  }

  const tarball = (await fsp.readFile(packDestination)).buffer

  // TODO: does this affect the buffer?
  await fsp.rm(packDestination, { recursive: true })

  return tarball
}

function guessPackageManager(directory: string) {
  if (fs.existsSync(path.resolve(directory, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  } else if (fs.existsSync(path.resolve(directory, 'yarn.lock'))) {
    return 'yarn'
  } else {
    return 'npm'
  }
}

async function getTempPackDir() {
  const tempDir = os.tmpdir() + path.sep
  const tempPackDir = await fsp.mkdtemp(tempDir + 'publint-pack-')
  return await fsp.realpath(tempPackDir)
}
