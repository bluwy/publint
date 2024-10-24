import { lintableFileExtensions } from './constants.js'

/**
 * @typedef {{
 *   name: string,
 *   main: string,
 *   module: string,
 *   exports: Record<string, string>,
 *   repository: Record<string, string> | string,
 *   type: 'module' | 'commonjs'
 * }} Pkg
 */

/**
 * @typedef {'ESM' | 'CJS' | 'mixed' | 'unknown'} CodeFormat
 */

// Reference: https://github.com/unjs/mlly/blob/c5ae321725cbabe230c16c315d474c36eee6a30c/src/syntax.ts#L7
const ESM_CONTENT_RE =
  /([\s;]|^)(import[\w,{}\s*]*from|import\s*['"*{]|export\b\s*(?:[*{]|default|type|function|const|var|let|async function)|import\.meta\b)/m
/**
 * @param {string} code
 */
export function isCodeEsm(code) {
  return ESM_CONTENT_RE.test(code)
}

// Reference: https://github.com/unjs/mlly/blob/c5ae321725cbabe230c16c315d474c36eee6a30c/src/syntax.ts#L15
const CJS_CONTENT_RE =
  /([\s;]|^)(module.exports\b|exports\.\w|require\s*\(|global\.\w|Object\.(defineProperty|defineProperties|assign)\s*\(\s*exports\b)/m
/**
 * @param {string} code
 */
export function isCodeCjs(code) {
  return CJS_CONTENT_RE.test(code)
}

const MULTILINE_COMMENTS_RE = /\/\*(.|[\r\n])*?\*\//gm
const SINGLELINE_COMMENTS_RE = /\/\/.*/g
/**
 * @param {string} code
 */
export function stripComments(code) {
  return code
    .replace(MULTILINE_COMMENTS_RE, '')
    .replace(SINGLELINE_COMMENTS_RE, '')
}

// Reference: https://git-scm.com/docs/git-clone#_git_urls and https://github.com/npm/hosted-git-info
const GIT_URL_RE =
  /^(git\+https?|git\+ssh|https?|ssh|git):\/\/(?:[\w._-]+@)?([\w.-]+)(?::([\w\d-]+))?(\/[\w._/-]+)\/?$/
/**
 * @param {string} url
 */
export function isGitUrl(url) {
  return GIT_URL_RE.test(url)
}
/**
 * @param {string} url
 */
export function isShorthandGitHubOrGitLabUrl(url) {
  const tokens = url.match(GIT_URL_RE)
  if (tokens) {
    const host = tokens[2]
    const path = tokens[4]

    if (/(github|gitlab)/.test(host)) {
      return !url.startsWith('git+') || !path.endsWith('.git')
    }
  }

  return false
}
/**
 * Reference: https://github.blog/security/application-security/improving-git-protocol-security-github/
 * @param {string} url
 */
export function isDeprecatedGitHubGitUrl(url) {
  const tokens = url.match(GIT_URL_RE)
  if (tokens) {
    const protocol = tokens[1]
    const host = tokens[2]

    if (/github/.test(host) && protocol === 'git') {
      return true
    }
  }

  return false
}

// Reference: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#repository
const SHORTHAND_REPOSITORY_URL_RE =
  /^(?:(?:github|bitbucket|gitlab):[\w\-]+\/[\w\-/]+|gist:\w+|[\w\-]+\/[\w\-]+)$/
/**
 * @param {string} url
 */
export function isShorthandRepositoryUrl(url) {
  return SHORTHAND_REPOSITORY_URL_RE.test(url)
}

/**
 * @param {string} code
 * @returns {CodeFormat}
 */
export function getCodeFormat(code) {
  code = stripComments(code)
  const isEsm = isCodeEsm(code)
  const isCjs = isCodeCjs(code)
  // In reality, a file can't have mixed ESM and CJS. It's syntactically incompatible in both environments.
  // But since we use regex, we can't correct identify ESM and CJS, so when this happens we should bail instead.
  // TODO: Yak shave a correct implementation.
  if (isEsm && isCjs) {
    return 'mixed'
  } else if (isEsm) {
    return 'ESM'
  } else if (isCjs) {
    return 'CJS'
  } else {
    // If we can't determine the format, it's likely that it doesn't import/export and require/exports.
    // Meaning it's a side-effectful file, which would always match the `format`
    return 'unknown'
  }
}

/**
 * Handle `exports` glob
 * @param {string} globStr An absolute glob string that must contain one `*`
 * @param {import('../index.d.ts').Vfs} vfs
 * @param {string[]} [packedFiles]
 * @returns {Promise<string[]>} Matched file paths
 */
export async function exportsGlob(globStr, vfs, packedFiles) {
  /** @type {string[]} */
  const filePaths = []
  const globStrRe = new RegExp(
    `^${slash(globStr).split('*').map(escapeRegExp).join('(.+)')}$`
  )
  // the longest directory that doesn't contain `*`
  const topDir = globStr.split('*')[0].match(/(.+)[/\\]/)?.[1]

  // TODO: maybe error if no topDir?
  if (topDir && (await vfs.isPathDir(topDir))) {
    await scanDir(topDir)
  }
  return filePaths

  /**
   * @param {string} dirPath
   */
  async function scanDir(dirPath) {
    const items = await vfs.readDir(dirPath)
    for (const item of items) {
      const itemPath = vfs.pathJoin(dirPath, item)
      if (
        !packedFiles ||
        packedFiles.some((file) => file.startsWith(itemPath))
      ) {
        if (await vfs.isPathDir(itemPath)) {
          await scanDir(itemPath)
        } else {
          const matched = slash(itemPath).match(globStrRe)
          // if have multiple `*`, all matched should be the same because the key
          // can only have one `*`
          if (matched) {
            if (matched.length > 2) {
              let allGlobSame = true
              for (let i = 2; i < matched.length; i++) {
                if (matched[i] !== matched[1]) {
                  allGlobSame = false
                  break
                }
              }
              if (allGlobSame) {
                filePaths.push(itemPath)
              }
            } else {
              filePaths.push(itemPath)
            }
          }
        }
      }
    }
  }
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 * @param {string} string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * @param {string} str
 */
function slash(str) {
  return str.replace(/\\/g, '/')
}

/**
 * @param {string} filePath
 * @param {import('../index.d.ts').Vfs} vfs
 * @returns {Promise<Exclude<CodeFormat, 'mixed' | 'unknown'>>}
 */
export async function getFilePathFormat(filePath, vfs) {
  // React Native bundler treats `.native.js` as special platform extension, the real format
  // can be found after stripping `.native.js`, which I think is good enough?
  // https://reactnative.dev/docs/platform-specific-code#native-specific-extensions-ie-sharing-code-with-nodejs-and-web
  // https://github.com/apollographql/apollo-client/issues/9976#issuecomment-1545472585
  // https://github.com/facebook/metro/issues/535
  if (filePath.endsWith('.native.js')) filePath = filePath.slice(0, -10)
  if (filePath.endsWith('.mjs')) return 'ESM'
  if (filePath.endsWith('.cjs')) return 'CJS'
  const nearestPkg = await getNearestPkg(filePath, vfs)
  return nearestPkg?.type === 'module' ? 'ESM' : 'CJS'
}

/**
 * @param {string} filePath
 * @param {import('../index.d.ts').Vfs} vfs
 * @returns {Promise<Exclude<CodeFormat, 'mixed' | 'unknown'>>}
 */
export async function getDtsFilePathFormat(filePath, vfs) {
  if (filePath.endsWith('.d.mts')) return 'ESM'
  if (filePath.endsWith('.d.cts')) return 'CJS'
  const nearestPkg = await getNearestPkg(filePath, vfs)
  return nearestPkg?.type === 'module' ? 'ESM' : 'CJS'
}

/**
 * @param {CodeFormat} format
 */
export function getCodeFormatExtension(format) {
  switch (format) {
    case 'ESM':
      return '.mjs'
    case 'CJS':
      return '.cjs'
    default:
      return '.js'
  }
}

/**
 * @param {CodeFormat} format
 */
export function getDtsCodeFormatExtension(format) {
  switch (format) {
    case 'ESM':
      return '.mts'
    case 'CJS':
      return '.cts'
    default:
      return '.ts'
  }
}

/**
 * @param {string} path
 */
export function isExplicitExtension(path) {
  return path.endsWith('.mjs') || path.endsWith('.cjs')
}

/**
 * only lint JS files. TS and others not supported.
 * @param {string} filePath
 */
export function isFilePathLintable(filePath) {
  return lintableFileExtensions.some((ext) => filePath.endsWith(ext))
}

// support:
// // @flow
// /* @flow */
// /** @flow */
// /**
//  * @flow
//  */
const FLOW_COMMENT_RE = /^\s*(?:\/\/|\/\*\*?|\*)\s*@flow/m
/**
 * don't lint Flow files, which is annotated by an initial `@flow` comment
 * @param {string} fileContent
 */
export function isFileContentLintable(fileContent) {
  return !FLOW_COMMENT_RE.test(fileContent)
}

/**
 * Whether the `filePath` looks like a relative path, e.g.
 * - ./foo
 * - ../foo
 * - foo/bar
 * @param {string} filePath
 */
export function isRelativePath(filePath) {
  if (filePath[0] === '.') return true
  return filePath[0] !== '/' && !filePath.includes(':')
}

/**
 * Whether the `filePath` looks like an absoluate path
 * @param {string} filePath
 */
export function isAbsolutePath(filePath) {
  return (
    filePath[0] === '/' ||
    (filePath[1] === ':' && filePath[0].match(/[a-zA-Z]/))
  )
}

/**
 * @param {string} filePath
 * @param {import('../index.d.ts').Vfs} vfs
 * @returns {Promise<Pkg | undefined>}
 */
export async function getNearestPkg(filePath, vfs) {
  let currentDir = vfs.getDirName(filePath)
  while (true) {
    const pkgJsonPath = vfs.pathJoin(currentDir, 'package.json')
    if (await vfs.isPathExist(pkgJsonPath)) {
      try {
        return JSON.parse(await vfs.readFile(pkgJsonPath))
      } catch {
        // ignore malformed package.json **cough** resolve **cough**
      }
    }
    const nextDir = vfs.getDirName(currentDir)
    if (nextDir === currentDir) break
    currentDir = nextDir
  }
}

/**
 * @param {string[]} path
 * @returns {string}
 */
export function formatMessagePath(path) {
  let formatted = 'pkg'
  for (const part of path) {
    if (/^\d+$/.test(part)) {
      // plain number
      formatted += `[${part}]`
    } else if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(part)) {
      // is invalid js var name
      formatted += `["${part}"]`
    } else {
      formatted += '.' + part
    }
  }
  return formatted
}

/**
 * @param {Pkg} pkg
 * @param {string[]} path
 * @returns {any}
 */
export function getPkgPathValue(pkg, path) {
  let v = pkg
  for (const p of path) {
    v = v[p]
  }
  return v
}

export function createPromiseQueue() {
  const promises = []
  return {
    push: (fn) => promises.push(fn()),
    wait: () => Promise.all(promises)
  }
}

/**
 * @param {Record<string, any>} pkgJson
 * @param {string} field
 * @returns {[value: any, path: string[]]}
 */
export function getPublishedField(pkgJson, field) {
  if (pkgJson.publishConfig?.[field]) {
    return [pkgJson.publishConfig[field], ['publishConfig', field]]
  } else {
    return [pkgJson[field], [field]]
  }
}

/**
 * @param {Record<string, any>} obj
 * @param {string} key
 */
export function objectHasKeyNested(obj, key) {
  for (const k in obj) {
    if (k === key) return true
    if (typeof obj[k] === 'object' && objectHasKeyNested(obj[k], key))
      return true
  }
  return false
}

/**
 * @param {string} filePath
 */
export function getAdjacentDtsPath(filePath) {
  // foo.js  -> foo.d.ts
  // foo.mjs -> foo.d.mts
  // foo.cjs -> foo.d.cts
  // foo.jsx -> foo.d.ts
  return filePath.replace(/\.([mc]?)jsx?$/, '.d.$1ts')
}

const DTS_RE = /\.d\.[mc]?ts$/
/**
 * @param {string} filePath
 */
export function isDtsFile(filePath) {
  return filePath.endsWith('.d.ts')
}

/**
 * simplified `exports` field resolver that expects `exportsValue` to be the path value directly.
 * no path matching will happen. `exportsValue` should be an object that contains only conditions
 * and their values, or a string
 * @param {Record<string, any> | string | string[]} exportsValue
 * @param {string[]} conditions
 * @param {string[]} [currentPath] matched conditions while resolving the exports
 * @param {{ dualPublish: boolean }} [_metadata]
 * @returns {{ value: string, path: string[], dualPublish: boolean } | undefined}
 */
export function resolveExports(
  exportsValue,
  conditions,
  currentPath = [],
  _metadata = { dualPublish: false }
) {
  if (typeof exportsValue === 'string') {
    // prettier-ignore
    return { value: exportsValue, path: currentPath, dualPublish: _metadata.dualPublish }
  } else if (Array.isArray(exportsValue)) {
    return resolveExports(
      exportsValue[0],
      conditions,
      currentPath.concat('0'),
      _metadata
    )
  }

  // while traversing the exports object, also keep info it the path we're traversing
  // intends to dual export. helpful for better logging heuristics.
  if (
    _metadata.dualPublish === false &&
    'import' in exportsValue &&
    'require' in exportsValue
  ) {
    _metadata.dualPublish = true
  }

  for (const key in exportsValue) {
    if (conditions.includes(key) || key === 'default') {
      return resolveExports(
        exportsValue[key],
        conditions,
        currentPath.concat(key),
        _metadata
      )
    }
  }
}

/**
 * @param {string} str
 * @param {string} search
 * @param {string} replace
 */
export function replaceLast(str, search, replace) {
  const index = str.lastIndexOf(search)
  if (index === -1) return str
  return str.slice(0, index) + replace + str.slice(index + search.length)
}
