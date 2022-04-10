// Serve local packages for testing. Run `pnpm packfix` first.
export function isLocalPkg(pkgName) {
  return import.meta.env.DEV && pkgName.startsWith('publint-')
}

export function debounce(fn, wait) {
  let t
  return function () {
    clearTimeout(t)
    t = setTimeout(() => fn.apply(this, arguments), wait)
  }
}

export function isArrayEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
