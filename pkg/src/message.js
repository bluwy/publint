import picocolors from 'picocolors'
import {
  formatMessagePath as fp,
  getPkgPathValue,
  replaceLast
} from './utils.js'

/** @type { import('picocolors/types.js').Colors | undefined } */
let _picocolorsHasColors
/** @type { import('picocolors/types.js').Colors | undefined } */
let _picocolorsNoColors

/**
 * @param {import('../index.d.ts').Message} m
 * @param {import('./utils.js').Pkg} pkg
 * @param {import('../utils.d.ts').FormatMessageOptions} opts
 */
export function formatMessage(m, pkg, opts = {}) {
  /** @type { import('picocolors/types.js').Colors } */
  let c = picocolors
  if (opts.color === true) {
    c = _picocolorsHasColors ??= picocolors.createColors(true)
  } else if (opts.color === false) {
    c = _picocolorsNoColors ??= picocolors.createColors(false)
  }

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
      return `${start} is written in ${c.yellow(m.args.actualFormat)}, but is interpreted as ${c.yellow(m.args.expectFormat)}. Consider using the ${c.yellow(m.args.expectExtension)} extension, e.g. ${c.bold(replaceLast(relativePath, '.js', m.args.expectExtension))}`
    }
    case 'FILE_INVALID_EXPLICIT_FORMAT': {
      const is = pv(m.path).includes('*') ? 'matches' : 'is'
      const relativePath = m.args.actualFilePath ?? pv(m.path)
      const start =
        m.path[0] === 'name'
          ? c.bold(relativePath)
          : `${c.bold(fp(m.path))} ${is} ${c.bold(relativePath)} which`
      // prettier-ignore
      return `${start} ends with the ${c.yellow(m.args.actualExtension)} extension, but the code is written in ${c.yellow(m.args.actualFormat)}. Consider using the ${c.yellow(m.args.expectExtension)} extension, e.g. ${c.bold(replaceLast(relativePath,m.args.actualExtension, m.args.expectExtension))}`
    }
    case 'FILE_INVALID_JSX_EXTENSION': {
      const is = m.args.globbedFilePath ? 'matches' : 'is'
      const relativePath = m.args.globbedFilePath ?? pv(m.path)
      const start =
        m.path[0] === 'name'
          ? c.bold(relativePath)
          : `${c.bold(fp(m.path))} ${is} ${c.bold(relativePath)} which`
      // prettier-ignore
      return `${start} uses an invalid ${c.bold(m.args.actualExtension)} extension. You don't need to split ESM and CJS formats for JSX. You should write a single file in ESM with the ${c.bold('.jsx')} extension instead, e.g. ${c.bold(replaceLast(pv(m.path), m.args.actualExtension, '.jsx'))}`
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
    case 'EXPORTS_MISSING_ROOT_ENTRYPOINT': {
      const mainField = m.args.mainFields[0]
      // prettier-ignore
      return `${c.bold(fp(m.path))} is missing the root entrypoint export, which is defined in ${c.bold('pkg.' + mainField)}. Environments that support the ${c.bold('"exports"')} field will ignore ${c.bold('pkg.' + mainField)} as ${c.bold('"exports"')} takes the highest priority. Consider adding ${c.bold(fp(m.path.concat('.')))}: "${c.bold(pv([mainField]))}".`
    }
    case 'USE_EXPORTS_BROWSER':
      // prettier-ignore
      return `${c.bold('pkg.browser')} with a string value can be refactored to use ${c.bold('pkg.exports')} and the ${c.bold('"browser"')} condition to declare browser-specific exports. ` +
      `e.g. ${c.bold('pkg.exports["."].browser')}: "${c.bold(pv(m.path))}". (This will be a breaking change)`
    case 'USE_EXPORTS_OR_IMPORTS_BROWSER':
      // prettier-ignore
      return `${c.bold('pkg.browser')} with an object value can be refactored to use ${c.bold('pkg.exports')}/${c.bold('pkg.imports')} and the ${c.bold('"browser"')} condition to declare browser-specific exports. (This will be a breaking change)`
    case 'USE_FILES':
      // prettier-ignore
      return `The package ${c.bold('publishes internal tests or config files')}. You can use ${c.bold('pkg.files')} to only publish certain files and save user bandwidth.`
    case 'USE_TYPE':
      // prettier-ignore
      return `The package does not specify the ${c.bold('"type"')} field. NodeJS may attempt to detect the package type causing a small performance hit. Consider adding ${c.bold('"type"')}: "${c.bold('commonjs')}".`
    case 'USE_LICENSE':
      // prettier-ignore
      return `The package does not specify the ${c.bold('"license"')} field but a license file was detected at ${c.bold(m.args.licenseFilePath)}. Consider adding a ${c.bold('"license"')} field so it's displayed on npm.`
    case 'TYPES_NOT_EXPORTED': {
      const typesFilePath = exportsRel(m.args.typesFilePath)
      if (m.args.actualExtension && m.args.expectExtension) {
        // prettier-ignore
        return `${c.bold(fp(m.path))} types is not exported. Consider adding ${c.bold(fp(m.path) + '.types')} to be compatible with TypeScript's ${c.bold('"moduleResolution": "bundler"')} compiler option. `
          + `Note that you cannot use "${c.bold(typesFilePath)}" because it has a mismatching format. Instead, you can duplicate the file and use the ${c.bold(m.args.expectExtension)} extension, e.g. `
          + `${c.bold(fp(m.path) + '.types')}: "${c.bold(replaceLast(typesFilePath, m.args.actualExtension, m.args.expectExtension))}"`
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

      let additionalMessage = ''
      // ambiguous default export
      if (m.args.expectFormat === 'ESM' && m.args.actualFormat === 'CJS') {
        additionalMessage = `This causes the types to be ambiguous when default importing the package due to its implied interop. `
      }
      // incorrect dynamic import restriction
      else if (m.args.expectFormat === 'CJS' && m.args.actualFormat === 'ESM') {
        additionalMessage = `This causes the types to only work when dynamically importing the package, even though the package exports CJS. `
      }

      // prettier-ignore
      return `${c.bold(fp(m.path))} types is interpreted as ${m.args.actualFormat} when resolving with the "${c.bold(m.args.condition)}" condition. `
        + additionalMessage
        + `Consider splitting out two ${c.bold('"types"')} conditions for ${c.bold('"import"')} and ${c.bold('"require"')}, and use the ${c.yellow(m.args.expectExtension)} extension, `
        + `e.g. ${c.bold(fp(expectPath))}: "${c.bold(replaceLast(pv(m.path), m.args.actualExtension, m.args.expectExtension))}"`
    }
    case 'FIELD_INVALID_VALUE_TYPE': {
      let expectStr = m.args.expectTypes[0]
      for (let i = 1; i < m.args.expectTypes.length; i++) {
        if (i === m.args.expectTypes.length - 1) {
          expectStr += ` or ${m.args.expectTypes[i]}`
        } else {
          expectStr += `, ${m.args.expectTypes[i]}`
        }
      }
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} which is an invalid ${c.bold(m.args.actualType)} type. Expected a ${c.bold(expectStr)} type instead.`
    }
    case 'EXPORTS_VALUE_CONFLICTS_WITH_BROWSER':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} which also matches ${c.bold(fp(m.args.browserPath))}: "${c.bold(pv(m.args.browserPath))}", which overrides the path when building the library with the "${c.bold(m.args.browserishCondition)}" condition. This is usually unintentional and may cause build issues. Consider using a different file name for ${c.bold(pv(m.path))}.`
    case 'DEPRECATED_FIELD_JSNEXT':
      // prettier-ignore
      return `${c.bold(fp(m.path))} is deprecated. ${c.bold('pkg.module')} should be used instead.`
    case 'INVALID_REPOSITORY_VALUE':
      switch (m.args.type) {
        case 'invalid-string-shorthand':
          // prettier-ignore
          return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} which isn't a valid shorthand value supported by npm. Consider using an object that references a repository.`
        case 'invalid-git-url':
          // prettier-ignore
          return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} which isn't a valid git URL. A valid git URL is usually in the form of "${c.bold('git+https://example.com/user/repo.git')}".`
        case 'deprecated-github-git-protocol':
          // prettier-ignore
          return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} which uses the git:// protocol that is deprecated by GitHub due to security concerns. Consider replacing the protocol with https://.`
        case 'shorthand-git-sites': {
          let fullUrl = pv(m.path)
          if (fullUrl[fullUrl.length - 1] === '/') {
            fullUrl = fullUrl.slice(0, -1)
          }
          if (!fullUrl.startsWith('git+')) {
            fullUrl = 'git+' + fullUrl
          }
          if (!fullUrl.endsWith('.git')) {
            fullUrl += '.git'
          }
          // prettier-ignore
          return `${c.bold(fp(m.path))} is ${c.bold(pv(m.path))} but could be a full git URL like "${c.bold(fullUrl)}".`
        }
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
