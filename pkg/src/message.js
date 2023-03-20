import c from 'picocolors'
import { formatMessagePath as fp, getPkgPathValue } from './utils.js'

/**
 * @param {import('..').Message} m
 * @param {import('./utils').Pkg} pkg
 */
export function printMessage(m, pkg) {
  /** @param {string[]} path */
  const pv = (path) => getPkgPathValue(pkg, path)

  switch (m.code) {
    case 'IMPLICIT_INDEX_JS_INVALID_FORMAT':
      return `index.js should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    case 'FILE_INVALID_FORMAT': {
      const is = pv(m.path).includes('*') ? 'matches' : 'is'
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      const start =
        m.path[0] === 'name'
          ? c.bold(relativePath)
          : `${c.bold(fp(m.path))} ${is} ${c.bold(relativePath)} and`
      // prettier-ignore
      return `${start} is written in ${c.yellow(m.args.actualFormat)}, but is interpreted as ${c.yellow(m.args.expectFormat)}. Consider using the ${c.yellow(m.args.expectExtension)} extension, e.g. ${c.bold(relativePath.replace('.js', m.args.expectExtension))}`
    }
    case 'FILE_INVALID_EXPLICIT_FORMAT': {
      const is = pv(m.path).includes('*') ? 'matches' : 'is'
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      const start =
        m.path[0] === 'name'
          ? c.bold(relativePath)
          : `${c.bold(fp(m.path))} ${is} ${c.bold(relativePath)} which`
      // prettier-ignore
      return `${start} ends with the ${c.yellow(m.args.actualExtension)} extension, but the code is written in ${c.yellow(m.args.actualFormat)}. Consider using the ${c.yellow(m.args.expectExtension)} extension, e.g. ${c.bold(relativePath.replace(m.args.actualExtension, m.args.expectExtension))}`
    }
    case 'FILE_DOES_NOT_EXIST':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${pv(m.path)} but the file does not exist.`
    case 'FILE_NOT_PUBLISHED':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${pv(m.path)} but the file is not published. Is it specified in ${c.bold('pkg.files')}?`
    case 'HAS_ESM_MAIN_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${c.bold('pkg.main')} is an ESM file, but it is usually better to use ${c.bold('pkg.exports')} instead. If you don't support NodeJS 12.6 and below, you can also remove ${c.bold('pkg.main')}. (This will be a breaking change)`
    case 'HAS_MODULE_BUT_NO_EXPORTS':
      // prettier-ignore
      return `${c.bold('pkg.module')} is used to output ESM, but ${c.bold('pkg.exports')} is not defined. As NodeJS doesn't read ${c.bold('pkg.module')}, the ESM output may be skipped. Consider adding ${c.bold('pkg.exports')} to export the ESM output. ${c.bold('pkg.module')} can usually be removed alongside too. (This will be a breaking change)`
    case 'MODULE_SHOULD_BE_ESM':
      // prettier-ignore
      return `${c.bold('pkg.module')} should be ESM, but the code is written in CJS.`
    case 'EXPORTS_GLOB_NO_MATCHED_FILES':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} but does not match any files.`
    case 'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING':
      // prettier-ignore
      return `${c.bold(fp(m.path))} maps to a path that ends with ${c.bold('/')} which is deprecated. Use ${c.bold(fp(m.args.expectPath))}: "${c.bold(m.args.expectValue)}" instead.`
    case 'EXPORTS_TYPES_SHOULD_BE_FIRST':
      // prettier-ignore
      return `${c.bold(fp(m.path))} should be the first in the object as required by TypeScript.`
    case 'EXPORTS_DEFAULT_SHOULD_BE_LAST':
      // prettier-ignore
      return `${c.bold(fp(m.path))} should be the last in the object so it doesn't take precedence over the keys following it.`
    case 'EXPORTS_MODULE_SHOULD_BE_ESM':
      // prettier-ignore
      return `${c.bold(fp(m.path))} should be ESM, but the code is written in CJS.`
    case 'EXPORTS_VALUE_INVALID':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} but is invalid as it does not start with "${c.bold('./')}". Use ${c.bold(m.args.suggestValue)} instead.`
    case 'USE_EXPORTS_BROWSER':
      // prettier-ignore
      return `${c.bold('pkg.browser')} can be refactored to use ${c.bold('pkg.exports')} and the ${c.bold('browser')} condition instead to declare browser-specific exports. (This will be a breaking change)`
    case 'TYPES_NOT_EXPORTED': {
      let target = fp(m.path)
      if (target.endsWith('.exports')) {
        target = 'The library'
      } else {
        target = c.bold(target)
      }
      // prettier-ignore
      return `${target} has types at ${c.bold(m.args.typesFilePath)} but it is not exported from ${c.bold('pkg.exports')}. Consider adding it to ${c.bold(fp(m.path) + '.types')} to be compatible with TypeScript's ${c.bold('"moduleResolution": "bundler"')} compiler option.`
    }
    default:
      return
  }
}
