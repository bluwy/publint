import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

export async function getTempPackDir() {
  const tempDir = os.tmpdir() + path.sep
  const tempPackDir = await fs.mkdtemp(tempDir + 'publint-pack-')
  return await fs.realpath(tempPackDir)
}
