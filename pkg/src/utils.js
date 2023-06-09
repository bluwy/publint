/**
 * @typedef {{
 *   name: string,
 *   main: string,
 *   module: string,
 *   exports: Record<string, string>,
 *   type: 'module' | 'commonjs'
 * }} Pkg
 */

/**
 * @typedef {'ESM' | 'CJS' | 'mixed' | 'unknown'} CodeFormat
 */

// Reference: https://github.com/unjs/mlly/blob/c5ae321725cbabe230c16c315d474c36eee6a30c/src/syntax.ts#L7
const ESM_CONTENT_RE =
  /([\s;]|^)(import[\w,{}\s*]*from|import\s*['"*{]|export\b\s*(?:[*{]|default|type|function|const|var|let|async function)|import\.meta\b)/m
export function isCodeEsm(code) {
  return ESM_CONTENT_RE.test(code)
}

// Reference: https://github.com/unjs/mlly/blob/c5ae321725cbabe230c16c315d474c36eee6a30c/src/syntax.ts#L15
const CJS_CONTENT_RE =
  /([\s;]|^)(module.exports\b|exports\.\w|require\s*\(|global\.\w|Object\.(defineProperty|defineProperties|assign)\s*\(\s*exports\b)/m
export function isCodeCjs(code) {
  return CJS_CONTENT_RE.test(code)
}

const MULTILINE_COMMENTS_RE = /\/\*(.|[\r\n])*?\*\//gm
const SINGLELINE_COMMENTS_RE = /\/\/.*/g
export function stripComments(code) {
  return code
    .replace(MULTILINE_COMMENTS_RE, '')
    .replace(SINGLELINE_COMMENTS_RE, '')
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
 * @param {import('..').Vfs} vfs
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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
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
 * @param {import('..').Vfs} vfs
 * @returns {Promise<CodeFormat>}
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
 * @param {string} path
 */
export function isExplicitExtension(path) {
  return path.endsWith('.mjs') || path.endsWith('.cjs')
}

/**
 *
 * @param {string} filePath
 * @param {import('..').Vfs} vfs
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
    // is invalid js var name
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(part)) {
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
 * Given a `typesVersions` config, return a resolver function that will resolve
 * a given path based on the `typesVersion` behaviour. This tries to match TypeScript's
 * behaviour as much as possible, but it likely doesn't in some case.
 * @param {Record<string, Record<string, string[]>>} typesVersions
 * @param {import('..').Vfs} vfs
 * @param {string} pkgDir
 * @returns {(filePath: string) => Promise<Record<string, string[] | undefined>>}
 */
export function createTypesVersionsResolver(typesVersions, vfs, pkgDir) {
  const typesVersionsKeys = Object.keys(typesVersions)

  if (typesVersionsKeys.length === 0) {
    return async (filePath) => {
      const fullFilePath = vfs.pathJoin(pkgDir, filePath)
      return {
        ['*']: (await vfs.isPathExist(fullFilePath))
          ? [fullFilePath]
          : undefined
      }
    }
  }

  /**
   * @param {string} filePath e.g. `/`, `/foo`, `foo`, `/bar/index.js`
   */
  return async (filePath) => {
    /** @type {Record<string, string[] | undefined>} */
    const result = {}
    for (const tsVersion of typesVersionsKeys) {
      const tsMap = typesVersions[tsVersion]
      const tsMapKeys = Object.keys(tsMap)

      // fast-path for root mapping
      if (filePath === '/') {
        result[tsVersion] = tsMap.index
        continue
      }

      // try to match each key as regex
      for (const key of tsMapKeys) {
        const regex = tsMapKeyToRegex(key)
        const matched = filePath.match(regex)
        if (matched) {
          let possibleResolvedPaths = tsMap[key].map((p) =>
            p[0] === '/' ? p : '/' + p
          )
          // handle glob *
          if (key.includes('*')) {
            possibleResolvedPaths = possibleResolvedPaths.map((p) =>
              p.replace('*', matched[1])
            )
          }
          // make sure path exists
          for (let i = 0; i < possibleResolvedPaths.length; i++) {
            const p = vfs.pathJoin(pkgDir, possibleResolvedPaths[i])
            if (await vfs.isPathExist(p)) break

            const exts = ['.d.ts', '.js', '/index.d.ts', '/index.js']
            for (const ext of exts) {
              if (await vfs.isPathExist(p + ext)) {
                // update to real matched path
                possibleResolvedPaths[i] = p + ext
                break
              }
            }

            // mark empty string to be filtered out later since it doesn't match a real path
            possibleResolvedPaths[i] = ''
          }
          result[tsVersion] = possibleResolvedPaths.filter(Boolean)
        }
      }
    }

    // default mapping if it doesn't match any typescript version
    // NOTE: this doesn't handle mappings that have `>4.0` and `<=4.0` as keys,
    // but that's a problem for another day :D
    if (!result['*']) {
      result['*'] = (await vfs.isPathExist(filePath)) ? [filePath] : undefined
    }
    return result
  }
}

/**
 * Convert TS map key to regex. The regex returns [1] if has *.
 * NOTE: This does not support more than one *, I'm not sure if that's allowed.
 * @param {string} key e.g. index, foo, *, /nested/*
 */
function tsMapKeyToRegex(key) {
  // strip leading slash
  if (key[0] === '/') {
    key = key.slice(1)
  }

  return new RegExp(`^\/?${key.split('*').map(escapeRegExp).join('(.+)')}$`)
}
