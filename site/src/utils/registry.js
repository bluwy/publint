/**
 * @param {string} link
 */
export function isNpmUrl(link) {
  try {
    const url = new URL(link)
    return (
      url.hostname === 'www.npmjs.com' && url.pathname.startsWith('/package/')
    )
  } catch {
    return false
  }
}

/**
 * @param {string} link
 */
export function isPkgPrNewUrl(link) {
  try {
    const url = new URL(link)
    return url.hostname === 'pkg.pr.new'
  } catch {
    return false
  }
}
