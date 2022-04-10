/**
 * @typedef {{
 *   name: string,
 *   main: string,
 *   module: string,
 *   exports: Record<string, string>,
 *   type: 'module' | 'commonjs'
 * }} Pkg
 */

/**
 * @typedef {'ESM' | 'CJS' | 'unknown'} CodeFormat
 */

const ESM_CONTENT_RE =
  /\bimport\s+|\bimport\(|\bexport\s+default\s+|\bexport\s+const\s+|\bexport\s+function\s+|\bexport\s+default\s+/
export function isCodeEsm(code) {
  return ESM_CONTENT_RE.test(code)
}

const CJS_CONTENT_RE =
  /\bmodule\.exports\b|\bexports[.\[]|\brequire\s*\(|\bObject\.(defineProperty|defineProperties|assign)\s*\(\s*exports\b/
export function isCodeCjs(code) {
  return CJS_CONTENT_RE.test(code)
}

/**
 * @param {string} code
 * @returns {CodeFormat}
 */
export function getCodeFormat(code) {
  if (isCodeEsm(code)) {
    return 'ESM'
  } else if (isCodeCjs(code)) {
    return 'CJS'
  } else {
    return 'unknown'
  }
}

export function isCodeMatchingFormat(code, format) {
  const f = getCodeFormat(code)
  // If we can't determine the format, it's likely that it doesn't import/export and require/exports.
  // Meaning it's a side-effectful file, which would always match the `format`
  return f === 'unknown' || f === format
}

/**
 * Handle `exports` glob
 * @param {string} globStr An absolute glob string that must contain one `*`
 * @param {import('../lib').Vfs} vfs
 * @returns {Promise<string[]>} Matched file paths
 */
export async function exportsGlob(globStr, vfs) {
  let filePaths = []
  const [dir, ext] = globStr.split('*')
  await scanDir(dir)
  return filePaths

  async function scanDir(dirPath) {
    const items = await vfs.readDir(dirPath)
    for (const item of items) {
      const itemPath = vfs.pathJoin(dirPath, item)
      if (await vfs.isPathDir(itemPath)) {
        await scanDir(itemPath)
      } else if (!ext || itemPath.endsWith(ext)) {
        filePaths.push(itemPath)
      }
    }
  }
}

/**
 * @param {string} filePath
 * @param {import('../lib').Vfs} vfs
 * @returns {Promise<CodeFormat>}
 */
export async function getFilePathFormat(filePath, vfs) {
  if (filePath.endsWith('.mjs')) return 'ESM'
  if (filePath.endsWith('.cjs')) return 'CJS'
  const nearestPkg = await getNearestPkg(filePath, vfs)
  return nearestPkg.type === 'module' ? 'ESM' : 'CJS'
}

/**
 * @param {CodeFormat} format
 */
export function getCodeFormatExtension(format) {
  switch (format) {
    case 'ESM':
      return '.mjs'
    case 'CJS':
      return '.cjs'
    default:
      return '.js'
  }
}

/**
 * @param {string} path
 */
export function isExplicitExtension(path) {
  return path.endsWith('.mjs') || path.endsWith('.cjs')
}

/**
 *
 * @param {string} filePath
 * @param {import('../lib').Vfs} vfs
 * @returns {Promise<Pkg>}
 */
export async function getNearestPkg(filePath, vfs) {
  let currentDir = vfs.getDirName(filePath)
  while (true) {
    const pkgJsonPath = vfs.pathJoin(currentDir, 'package.json')
    if (await vfs.isPathExist(pkgJsonPath))
      return JSON.parse(await vfs.readFile(pkgJsonPath))
    const nextDir = vfs.getDirName(currentDir)
    if (nextDir === currentDir) break
    currentDir = nextDir
  }
}

/**
 * @param {string[]} path
 * @returns {string}
 */
export function formatMessagePath(path) {
  let formatted = 'pkg.'
  if (path[0] === 'exports') {
    formatted += 'exports'
    if (path[1]) {
      formatted += ' > ' + path.slice(1).join(' > ')
    }
  } else {
    formatted += path.join('.')
  }
  return formatted
}

/**
 * @param {Pkg} pkg
 * @param {string[]} path
 * @returns {any}
 */
export function getPkgPathValue(pkg, path) {
  let v = pkg
  for (const p of path) {
    v = v[p]
  }
  return v
}
