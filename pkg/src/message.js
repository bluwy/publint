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
      const isGlob = getPathValue(m.path).includes('*')
      const is = isGlob ? 'matches' : 'is'
      const relativePath = m.args.actualFilePath ?? getPathValue(m.path)

      if (
        m.args.actualExtension.endsWith('.mjs') ||
        m.args.actualExtension.endsWith('.cjs')
      ) {
        // prettier-ignore
        return `${c.bold(concatPath(m.path))} ${is} ${c.bold(relativePath)} which ends with the ${c.yellow(m.args.actualExtension)} extension, but the code is written in ${c.yellow(m.args.actualFormat)}. Consider re-writting the code to ${c.yellow(m.args.expectFormat)}, or use the ${c.yellow(m.args.expectExtension)} extension, e.g. ${c.bold(getPathValue(m.path).replace(m.args.actualExtension, m.args.expectExtension))}`
      } else {
        // prettier-ignore
        return `${c.bold(concatPath(m.path))} ${is} ${c.bold(relativePath)} and is detected to be ${c.yellow(m.args.expectFormat)}, but the code is written in ${c.yellow(m.args.actualFormat)}. Consider re-writting the code to ${c.yellow(m.args.expectFormat)}, or use the ${c.yellow(m.args.actualExtension)} extension, e.g. ${c.bold(getPathValue(m.path).replace('.js', m.args.actualExtension))}`
      }

      // prettier-ignore
      return `${c.bold(concatPath(m.path))} is ${getPathValue(m.path)} should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'FILE_DOES_NOT_EXIST':
      // prettier-ignore
      return `${c.bold(concatPath(m.path))} is ${getPathValue(m.path)} but file does not exist`
    case 'HAS_ESM_MAIN_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${c.bold('pkg.main')} is an ESM file, but it is usually better to use ${c.bold('pkg.exports')} instead, and remove ${c.bold('pkg.main')} alongside, as compatible NodeJS versions support is as well.`
    case 'MODULE_SHOULD_BE_ESM':
      // prettier-ignore
      return `${c.bold('pkg.module')} is used for ESM output, but ${c.bold('pkg.exports')} is not defined. This would not work for NodeJS as it does not read ${c.bold('pkg.module')}, the field is read by bundlers like Rollup and Webpack only. Consider adding ${c.bold('pkg.export')} to export the ESM output too. Usually ${c.bold('pkg.module')} can be removed alongside too.`
    case 'MODULE_SHOULD_BE_ESM':
      // TODO: Show how we know this? Likely case is `type: module`
      // prettier-ignore
      return `${c.bold('pkg.module')} should be ESM, but the code is written in CJS.`
    case 'EXPORTS_GLOB_NO_MATCHED_FILES':
      // prettier-ignore
      return `${c.bold(concatPath(m.path))} is ${c.bold(getPathValue(m.path))} but does not match any files`
    case 'EXPORTS_TYPES_SHOULD_BE_FIRST':
      // prettier-ignore
      return `${c.bold(concatPath(m.path) + '.types')} should be the first in the object so TypeScript can load it.`
    case 'EXPORTS_DEFAULT_SHOULD_BE_LAST':
      // prettier-ignore
      return `${c.bold(concatPath(m.path) + '.default')} should be the last in the object so it doesn't take precedence over the keys following it.`
    default:
    // TODO
  }

  /**
   * @param {string[]} path
   */
  function concatPath(path) {
    let formatted = 'pkg.'
    if (path[0] === 'export') {
      formatted += `["${path.shift()}"]`
      formatted += path.join(' > ')
    } else {
      formatted += path.join('.')
    }
    return formatted
  }

  /**
   * @param {string[]} path
   * @returns {string}
   */
  function getPathValue(path) {
    let v = pkg
    for (const p of path) {
      v = v[p]
    }
    // @ts-ignore
    return v
  }
}
