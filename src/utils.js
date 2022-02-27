import path from 'path'
import fsp from 'fs/promises'

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

export function isCodeMatchingFormat(code, format) {
  const isEsm = isCodeEsm(code)
  const isCjs = isCodeCjs(code)
  // If we can't determine the format, it's likely that it doesn't import/export and require/exports.
  // Meaning it's a side-effectful file, which would always match the `format`
  if (!isEsm && !isCjs) return true
  return format === 'esm' ? isEsm : isCjs
}

/**
 * Handle `exports` glob
 * @param {string} globStr An absolute glob string that must contain one `*`
 * @returns {Promise<string[]>} Matched file paths
 */
export async function exportsGlob(globStr) {
  let filePaths = []
  const [dir, ext] = globStr.split('*')
  await scanDir(dir)
  return filePaths

  async function scanDir(dirPath) {
    const dirents = await fsp.readdir(dirPath, { withFileTypes: true })
    for (const dirent of dirents) {
      const direntPath = path.join(dirPath, dirent.name)
      if (dirent.isDirectory()) {
        await scanDir(direntPath)
      } else if (!ext || direntPath.endsWith(ext)) {
        filePaths.push(direntPath)
      }
    }
  }
}
