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
