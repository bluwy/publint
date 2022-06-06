import { formatMessagePath as fp, getPkgPathValue } from 'publint/utils'

/**
 * @param {import('types').Message} m
 * @param {import('./utils').Pkg} pkg
 */
export function printMessage(m, pkg) {
  /** @param {string[]} path */
  const pv = (path) => getPkgPathValue(pkg, path)
  /** @param {string} s */
  const bold = (s) => `<strong><code>${s}</code></strong>`
  /** @param {string} s */
  const warn = (s) => `<strong><code>${s}</code></strong>`

  // TODO: verbose mode
  switch (m.code) {
    case 'IMPLICIT_INDEX_JS_INVALID_FORMAT':
      return `index.js should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'FILE_INVALID_FORMAT': {
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      // prettier-ignore
      return `${bold(relativePath)} is written in ${warn(m.args.actualFormat)}, but is interpreted as ${warn(m.args.expectFormat)}. Consider using the ${warn(m.args.expectExtension)} extension, e.g. ${bold(relativePath.replace('.js', m.args.expectExtension))}`
    }
    case 'FILE_INVALID_EXPLICIT_FORMAT': {
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      // prettier-ignore
      return `${bold(relativePath)} ends with the ${warn(m.args.actualExtension)} extension, but the code is written in ${warn(m.args.actualFormat)}. Consider using the ${warn(m.args.expectExtension)} extension, e.g. ${bold(relativePath.replace(m.args.actualExtension, m.args.expectExtension))}`
    }
    case 'FILE_DOES_NOT_EXIST':
      // prettier-ignore
      return `File does not exist`
    case 'HAS_ESM_MAIN_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${bold('pkg.main')} is an ESM file, but it is usually better to use ${bold('pkg.exports')} instead, and remove ${bold('pkg.main')} alongside, as compatible NodeJS versions support it as well.`
    case 'HAS_MODULE_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${bold('pkg.module')} is used to output ESM, but ${bold('pkg.exports')} is not defined. This would not work for NodeJS as it does not read ${bold('pkg.module')}, the field is only useful for bundlers like Rollup and Webpack. Consider adding ${bold('pkg.exports')} to export the ESM output. ${bold('pkg.module')} can usually be removed alongside too.`
    case 'MODULE_SHOULD_BE_ESM':
      // TODO: Show how we know this? Likely case is `type: module`
      // prettier-ignore
      return `Should be ESM, but the code is written in CJS.`
    case 'EXPORTS_GLOB_NO_MATCHED_FILES':
      // prettier-ignore
      return `Does not match any files.`
    case 'EXPORTS_TYPES_SHOULD_BE_FIRST':
      // prettier-ignore
      return `Should be the first in the object as required by TypeScript.`
    case 'EXPORTS_DEFAULT_SHOULD_BE_LAST':
      // prettier-ignore
      return `Should be the last in the object so it doesn't take precedence over the keys following it.`
    default:
    // TODO
  }
}
