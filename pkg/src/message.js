import c from 'picocolors'
import { formatMessagePath as fp, getPkgPathValue } from './utils.js'

/**
 * @param {import('../index.d.ts').Message} m
 * @param {import('./utils.js').Pkg} pkg
 */
export function formatMessage(m, pkg) {
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
      return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} but the file does not exist.`
    case 'FILE_NOT_PUBLISHED':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} but the file is not published. Is it specified in ${c.bold('pkg.files')}?`
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
    case 'EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE': {
      // prettier-ignore
      return `${c.bold(fp(m.path))} should come before the "require" condition so it can take precedence when used by a bundler.`
    }
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
      return `${c.bold('pkg.browser')} with a string value can be refactored to use ${c.bold('pkg.exports')} and the ${c.bold('"browser"')} condition to declare browser-specific exports. ` +
      `e.g. ${c.bold('pkg.exports["."].browser')}: "${c.bold(pv(m.path))}". (This will be a breaking change)`
    case 'USE_EXPORTS_OR_IMPORTS_BROWSER':
      // prettier-ignore
      return `${c.bold('pkg.browser')} with an object value can be refactored to use ${c.bold('pkg.exports')}/${c.bold('pkg.imports')} and the ${c.bold('"browser"')} condition to declare browser-specific exports. (This will be a breaking change)`
    case 'TYPES_NOT_EXPORTED': {
      const typesFilePath = exportsRel(m.args.typesFilePath)
      if (m.args.actualExtension && m.args.expectExtension) {
        // prettier-ignore
        return `${c.bold(fp(m.path))} types is not exported. Consider adding ${c.bold(fp(m.path) + '.types')} to be compatible with TypeScript's ${c.bold('"moduleResolution": "bundler"')} compiler option. `
          + `Note that you cannot use "${c.bold(typesFilePath)}" because it has a mismatching format. Instead, you can duplicate the file and use the ${c.bold(m.args.expectExtension)} extension, e.g. `
          + `${c.bold(fp(m.path) + '.types')}: "${c.bold(typesFilePath.replace(m.args.actualExtension, m.args.expectExtension))}"`
      } else {
        // prettier-ignore
        return `${c.bold(fp(m.path))} types is not exported. Consider adding ${c.bold(fp(m.path) + '.types')}: "${c.bold(typesFilePath)}" to be compatible with TypeScript's ${c.bold('"moduleResolution": "bundler"')} compiler option.`
      }
    }
    case 'EXPORT_TYPES_INVALID_FORMAT': {
      // convert ['exports', 'types'] -> ['exports', '<condition>', 'types']
      // convert ['exports', 'types', 'node'] -> ['exports', 'types', 'node', '<condition>']
      const expectPath = m.path.slice()
      const typesIndex = m.path.findIndex((p) => p === 'types')
      if (typesIndex === m.path.length - 1) {
        expectPath.splice(typesIndex, 0, m.args.condition)
      } else {
        expectPath.push(m.args.condition)
      }
      // prettier-ignore
      return `${c.bold(fp(m.path))} types is an invalid format when resolving with the "${c.bold(m.args.condition)}" condition. Consider splitting out two ${c.bold("types")} conditions for ${c.bold("import")} and ${c.bold("require")}, and use the ${c.yellow(m.args.expectExtension)} extension, `
        + `e.g. ${c.bold(fp(expectPath))}: "${c.bold(pv(m.path).replace(m.args.actualExtension, m.args.expectExtension))}"`
    }
    default:
      return
  }
}

/**
 * Make sure s is an `"exports"` compatible relative path
 * @param {string} s
 */
function exportsRel(s) {
  if (s[0] === '.') return s
  if (s[0] === '/') return '.' + s
  return './' + s
}
