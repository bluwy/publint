export function isPkgPrNewUrl(link) {
  try {
    const url = new URL(link)
    return url.hostname === 'pkg.pr.new'
  } catch {
    return false
  }
}
