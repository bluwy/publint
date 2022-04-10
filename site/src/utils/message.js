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

  let is, relativePath

  // TODO: verbose mode
  switch (m.code) {
    case 'IMPLICIT_INDEX_JS_INVALID_FORMAT':
      return `index.js should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'FILE_INVALID_FORMAT':
      is = pv(m.path).includes('*') ? 'matches' : 'is'
      relativePath = m.args.actualFilePath ?? pv(m.path)
      // prettier-ignore
      return `${bold(fp(m.path))} ${is} ${bold(relativePath)} and is detected to be ${warn(m.args.expectFormat)}, but the code is written in ${warn(m.args.actualFormat)}. Consider re-writting the code to ${warn(m.args.expectFormat)}, or use the ${warn(m.args.expectExtension)} extension, e.g. ${bold(pv(m.path).replace('.js', m.args.expectExtension))}`
    case 'FILE_INVALID_EXPLICIT_FORMAT':
      is = pv(m.path).includes('*') ? 'matches' : 'is'
      relativePath = m.args.actualFilePath ?? pv(m.path)
      // prettier-ignore
      return `${bold(fp(m.path))} ${is} ${bold(relativePath)} which ends with the ${warn(m.args.actualExtension)} extension, but the code is written in ${warn(m.args.actualFormat)}. Consider re-writting the code to ${warn(m.args.expectFormat)}, or use the ${warn(m.args.expectExtension)} extension, e.g. ${bold(pv(m.path).replace(m.args.actualExtension, m.args.expectExtension))}`
    case 'FILE_DOES_NOT_EXIST':
      // prettier-ignore
      return `${bold(fp(m.path))} is ${pv(m.path)} but file does not exist`
    case 'HAS_ESM_MAIN_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${bold('pkg.main')} is an ESM file, but it is usually better to use ${bold('pkg.exports')} instead, and remove ${bold('pkg.main')} alongside, as compatible NodeJS versions support is as well.`
    case 'MODULE_SHOULD_BE_ESM':
      // prettier-ignore
      return `${bold('pkg.module')} is used for ESM output, but ${bold('pkg.exports')} is not defined. This would not work for NodeJS as it does not read ${bold('pkg.module')}, the field is read by bundlers like Rollup and Webpack only. Consider adding ${bold('pkg.export')} to export the ESM output too. Usually ${bold('pkg.module')} can be removed alongside too.`
    case 'MODULE_SHOULD_BE_ESM':
      // TODO: Show how we know this? Likely case is `type: module`
      // prettier-ignore
      return `${bold('pkg.module')} should be ESM, but the code is written in CJS.`
    case 'EXPORTS_GLOB_NO_MATCHED_FILES':
      // prettier-ignore
      return `${bold(fp(m.path))} is ${bold(pv(m.path))} but does not match any files`
    case 'EXPORTS_TYPES_SHOULD_BE_FIRST':
      // prettier-ignore
      return `${bold(fp(m.path) + '.types')} should be the first in the object so TypeScript can load it.`
    case 'EXPORTS_DEFAULT_SHOULD_BE_LAST':
      // prettier-ignore
      return `${bold(fp(m.path) + '.default')} should be the last in the object so it doesn't take precedence over the keys following it.`
    default:
    // TODO
  }
}
