import c from 'picocolors'

/**
 * @param {import('types').Message} m
 * @param {import('./utils').Pkg} pkg
 */
export function printMessage(m, pkg) {
  // TODO: verbose mode
  switch (m.code) {
    case 'IMPLICIT_INDEX_JS_INVALID_FORMAT':
      return `index.js should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'FILE_INVALID_FORMAT':
      // prettier-ignore
      return `${concatPath(m.path)} is ${getPathValue(m.path)} should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'HAS_MODULE_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${c.bold('pkg.main')} is an ESM file, but it is usually better to use ${c.bold('pkg.exports')} instead, and remove ${c.bold('pkg.main')} alongside, as compatible NodeJS versions support is as well.`
    default:
    // TODO
  }

  /**
   * @param {string[]} path
   */
  function concatPath(path) {
    return `pkg.` + path.join('.')
  }

  /**
   * @param {string[]} path
   */
  function getPathValue(path) {
    let v = pkg
    for (const p of path) {
      v = v[p]
    }
    return v
  }
}
