import fss from 'node:fs'
import path from 'node:path'

/**
 * @param {string} dir
 */
export function guessPackageManager(dir) {
  const foundFile = findUp(dir, [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ])
  if (foundFile?.endsWith('pnpm-lock.yaml')) return 'pnpm'
  if (foundFile?.endsWith('yarn.lock')) return 'yarn'
  return 'npm'
}

/**
 * @param {string} dir
 * @param {string[]} files
 */
function findUp(dir, files) {
  while (dir) {
    for (const file of files) {
      const filePath = path.join(dir, file)
      try {
        const stat = fss.statSync(filePath)
        if (stat.isFile()) {
          return filePath
        }
      } catch {}
    }

    const nextDir = path.dirname(dir)
    if (nextDir === dir) break
    dir = nextDir
  }

  return undefined
}
