// Serve local packages for testing. Run `pnpm packfix` first.
/**
 * @param {string} pkgName
 */
export function isLocalPkg(pkgName) {
  return import.meta.env.DEV && pkgName.startsWith('publint-')
}

/**
 * @param {Function} fn
 * @param {number} wait
 */
export function debounce(fn, wait) {
  /** @type {number} */
  let t
  return function () {
    clearTimeout(t)
    // @ts-expect-error
    t = setTimeout(() => fn.apply(this, arguments), wait)
  }
}

/**
 * @param {Array<any>} a
 * @param {Array<any>} b
 */
export function isArrayEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
