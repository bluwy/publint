import {
  commonInternalPaths,
  invalidJsxExtensions,
  knownBrowserishConditions,
  licenseFiles
} from './constants.js'
import {
  exportsGlob,
  getCodeFormat,
  getFilePathFormat,
  getCodeFormatExtension,
  isExplicitExtension,
  createPromiseQueue,
  getPublishedField,
  objectHasKeyNested,
  isFilePathLintable,
  isFileContentLintable,
  getAdjacentDtsPath,
  resolveExports,
  isDtsFile,
  getDtsFilePathFormat,
  getDtsCodeFormatExtension,
  getPkgPathValue,
  replaceLast,
  isRelativePath,
  isAbsolutePath,
  isGitUrl,
  isShorthandRepositoryUrl,
  isShorthandGitHubOrGitLabUrl,
  isDeprecatedGitHubGitUrl
} from './utils.js'

/**
 * Includes internal _include that used to filter paths that is packed.
 * Mainly for node.js local usage only. So that we lint files that are packed only.
 * Currently only used if pkg has no `exports`
 * @typedef {Required<import('../index.d.ts').Options> & {
 *   _packedFiles?: string[]
 * }} Options
 */

/**
 * @param {Options} options
 * @returns {Promise<import('../index.d.ts').Result>}
 */
export async function publint({ pkgDir, vfs, level, strict, _packedFiles }) {
  /** @type {import('../index.d.ts').Message[]} */
  const messages = []
  /**
   * A promise queue is created to run all linting tasks in parallel
   */
  const promiseQueue = createPromiseQueue()

  const rootPkgPath = vfs.pathJoin(pkgDir, 'package.json')
  const rootPkgContent = await readFile(rootPkgPath, [])
  if (rootPkgContent === false) return { messages }
  const rootPkg = JSON.parse(rootPkgContent)
  const [main, mainPkgPath] = getPublishedField(rootPkg, 'main')
  const [module, modulePkgPath] = getPublishedField(rootPkg, 'module')
  const [exports, exportsPkgPath] = getPublishedField(rootPkg, 'exports')

  // Check if package published internal tests or config files
  if (rootPkg.files == null) {
    promiseQueue.push(async () => {
      for (const p of commonInternalPaths) {
        const internalPath = vfs.pathJoin(pkgDir, p)
        if (
          _packedFiles &&
          _packedFiles.every((f) => !f.startsWith(internalPath))
        ) {
          continue
        }
        if (await vfs.isPathExist(internalPath)) {
          messages.push({
            code: 'USE_FILES',
            args: {},
            path: ['name'],
            type: 'suggestion'
          })
          break
        }
      }
    })
  }

  // Check if has license file but no license field
  if (rootPkg.license == null) {
    promiseQueue.push(async () => {
      const topFiles = await vfs.readDir(pkgDir)
      /** @type {string | undefined} */
      let matchedLicenseFilePath
      for (const f of topFiles) {
        if (await vfs.isPathDir(vfs.pathJoin(pkgDir, f))) continue
        if (licenseFiles.some((r) => r.test(f))) {
          matchedLicenseFilePath = '/' + f
          break
        }
      }
      if (matchedLicenseFilePath) {
        messages.push({
          code: 'USE_LICENSE',
          args: { licenseFilePath: matchedLicenseFilePath },
          path: ['name'],
          type: 'suggestion'
        })
      }
    })
  }

  // Check if "type" field is specified, help Node.js push towards an ESM default future:
  // https://nodejs.org/en/blog/release/v20.10.0
  if (rootPkg.type == null) {
    messages.push({
      code: 'USE_TYPE',
      args: {},
      path: ['name'],
      type: 'suggestion'
    })
  }

  // Relies on default node resolution
  // https://nodejs.org/api/modules.html#all-together
  // LOAD_INDEX(X)
  if (main == null && module == null && exports == null) {
    promiseQueue.push(async () => {
      // check index.js only, others aren't our problem
      const defaultPath = vfs.pathJoin(pkgDir, 'index.js')
      if (await vfs.isPathExist(defaultPath)) {
        const defaultContent = await readFile(defaultPath, [])
        if (defaultContent === false) return
        const actualFormat = getCodeFormat(defaultContent)
        const expectFormat = await getFilePathFormat(defaultPath, vfs)
        if (
          actualFormat !== expectFormat &&
          actualFormat !== 'unknown' &&
          actualFormat !== 'mixed'
        ) {
          messages.push({
            code: 'IMPLICIT_INDEX_JS_INVALID_FORMAT',
            args: {
              actualFormat,
              expectFormat
            },
            path: ['name'],
            type: 'warning'
          })
        }
      }
    })
  }

  /**
   * Rules for main:
   * - It's mostly used for CJS
   * - It can be used for ESM, but if you're doing so, might as well use exports
   */
  if (main != null) {
    promiseQueue.push(async () => {
      if (!ensureTypeOfField(main, ['string'], mainPkgPath)) return
      const mainPath = vfs.pathJoin(pkgDir, main)
      const mainContent = await readFile(mainPath, mainPkgPath, [
        '.js',
        '/index.js'
      ])
      if (mainContent === false) return
      if (hasInvalidJsxExtension(main, mainPkgPath)) return
      if (!isFilePathLintable(main)) return
      const actualFormat = getCodeFormat(mainContent)
      const expectFormat = await getFilePathFormat(mainPath, vfs)
      if (
        actualFormat !== expectFormat &&
        actualFormat !== 'unknown' &&
        actualFormat !== 'mixed'
      ) {
        const actualExtension = vfs.getExtName(mainPath)
        messages.push({
          code: isExplicitExtension(actualExtension)
            ? 'FILE_INVALID_EXPLICIT_FORMAT'
            : 'FILE_INVALID_FORMAT',
          args: {
            actualFormat,
            expectFormat,
            actualExtension,
            expectExtension: getCodeFormatExtension(actualFormat)
          },
          path: mainPkgPath,
          type: 'warning'
        })
      }
      if (actualFormat === 'ESM' && exports == null) {
        messages.push({
          code: 'HAS_ESM_MAIN_BUT_NO_EXPORTS',
          args: {},
          path: mainPkgPath,
          type: 'suggestion'
        })
      }
    })
  }

  /**
   * Rules for module:
   * - Bundler-specific
   * - Is not a way to support dual packages in NodeJS
   * - Should be MJS always!!
   */
  if (module != null) {
    promiseQueue.push(async () => {
      if (!ensureTypeOfField(module, ['string'], modulePkgPath)) return
      const modulePath = vfs.pathJoin(pkgDir, module)
      const moduleContent = await readFile(modulePath, modulePkgPath, [
        '.js',
        '/index.js'
      ])
      if (moduleContent === false) return
      if (hasInvalidJsxExtension(module, modulePkgPath)) return
      if (!isFilePathLintable(module)) return
      const actualFormat = getCodeFormat(moduleContent)
      if (actualFormat === 'CJS') {
        messages.push({
          code: 'MODULE_SHOULD_BE_ESM',
          args: {},
          path: modulePkgPath,
          type: 'error'
        })
      }
      // TODO: Check valid content too?
      if (!exports) {
        messages.push({
          code: 'HAS_MODULE_BUT_NO_EXPORTS',
          args: {},
          path: modulePkgPath,
          type: 'suggestion'
        })
      }
    })
  }

  // if main or module is exists, and exports exists, check if there's a root
  // entrypoint in exports. it may be mistaken that exports can be used to define
  // nested entrypoints only (missing the root entrypoint)
  if ((main != null || module != null) && exports != null) {
    let hasRootExports = true
    if (typeof exports == 'object') {
      const exportsKeys = Object.keys(exports)
      // an exports object could contain conditions, or paths that maps to other objects.
      // we can determine the type of the object by checking one of the keys ([0])
      // if it's a path, which we can then proceed to check if it has the root path
      if (exportsKeys[0]?.startsWith('.') && !exportsKeys.includes('.')) {
        hasRootExports = false
      }
    }
    if (!hasRootExports) {
      const mainFields = []
      if (main) mainFields.push('main')
      if (module) mainFields.push('module')
      messages.push({
        code: 'EXPORTS_MISSING_ROOT_ENTRYPOINT',
        args: { mainFields },
        path: exportsPkgPath,
        type: 'warning'
      })
    }
  }

  // if `repository` field exist, check if the value is valid
  // `repository` might be a shorthand string of URL or an object
  if ('repository' in rootPkg) {
    promiseQueue.push(() => checkRepositoryField(rootPkg.repository))
  }

  // check file existence for other known package fields
  const knownFields = [
    'types',
    'typings',
    'jsnext:main',
    'jsnext',
    'unpkg',
    'jsdelivr'
  ]
  // if has typesVersions field, it complicates `types`/`typings` field resolution a lot.
  // for now skip it, but further improvements are tracked at
  // https://github.com/bluwy/publint/issues/42
  if (getPublishedField(rootPkg, 'typesVersions')[0]) {
    knownFields.splice(0, 2)
  }
  for (const fieldName of knownFields) {
    const [fieldValue, fieldPkgPath] = getPublishedField(rootPkg, fieldName)
    if (
      fieldValue != null &&
      ensureTypeOfField(fieldValue, ['string'], fieldPkgPath)
    ) {
      promiseQueue.push(async () => {
        const fieldPath = vfs.pathJoin(pkgDir, fieldValue)
        const hasContent =
          (await readFile(fieldPath, fieldPkgPath, ['.js', '/index.js'])) !==
          false
        if (
          hasContent &&
          (fieldName === 'jsnext:main' || fieldName === 'jsnext')
        ) {
          messages.push({
            code: 'DEPRECATED_FIELD_JSNEXT',
            args: {},
            path: fieldPkgPath,
            // `module` should be used instead, but if it's already specified, downgrade as a suggestion
            // as the jsnext fields are likely for compat only.
            type: module ? 'suggestion' : 'warning'
          })
        }
      })
    }
  }

  // check file existence for browser field
  const [browser, browserPkgPath] = getPublishedField(rootPkg, 'browser')
  if (browser) {
    crawlBrowser(browser, browserPkgPath)
    // if the package has both the `browser` and `exports` fields, recommend to use
    // the browser condition instead
    if (exports) {
      if (typeof browser === 'string') {
        messages.push({
          code: 'USE_EXPORTS_BROWSER',
          args: {},
          path: browserPkgPath,
          type: 'suggestion'
        })
      } else {
        messages.push({
          code: 'USE_EXPORTS_OR_IMPORTS_BROWSER',
          args: {},
          path: browserPkgPath,
          type: 'suggestion'
        })
      }
    }
  }

  if (exports) {
    // recursively check exports
    crawlExports(exports, exportsPkgPath)
    // make sure types are exported for moduleResolution bundler
    doCheckTypesExported()
  } else {
    // all files can be accessed. verify them all
    promiseQueue.push(async () => {
      const files = await exportsGlob(
        vfs.pathJoin(pkgDir, './*'),
        vfs,
        _packedFiles
      )
      const pq = createPromiseQueue()
      for (const filePath of files) {
        if (
          hasInvalidJsxExtension(
            filePath,
            ['name'],
            '/' + vfs.pathRelative(pkgDir, filePath)
          )
        )
          continue
        if (!isFilePathLintable(filePath)) continue
        pq.push(async () => {
          const fileContent = await readFile(filePath, [])
          if (fileContent === false) return
          if (!isFileContentLintable(fileContent)) return
          const actualFormat = getCodeFormat(fileContent)
          const expectFormat = await getFilePathFormat(filePath, vfs)
          if (
            actualFormat !== expectFormat &&
            actualFormat !== 'unknown' &&
            actualFormat !== 'mixed'
          ) {
            // special case where if the file path contains the keyword "browser" or
            // "bundler", but it has problems. allow skipping the problem if it's ESM.
            const isSafeEsm =
              actualFormat === 'ESM' &&
              (filePath.includes('browser') || filePath.includes('bundler'))
            if (isSafeEsm) return

            const actualExtension = vfs.getExtName(filePath)
            const expectExtension = getCodeFormatExtension(actualFormat)

            // test if the expected extension and file path already exist. if so, skip warning as
            // this invalid format file is probably intentional for other use.
            // NOTE: only relax this for globbed files, as they're implicitly exported.
            const expectFilePath = replaceLast(
              filePath,
              actualExtension,
              expectExtension
            )
            if (await vfs.isPathExist(expectFilePath)) return

            messages.push({
              code: isExplicitExtension(actualExtension)
                ? 'FILE_INVALID_EXPLICIT_FORMAT'
                : 'FILE_INVALID_FORMAT',
              args: {
                actualFormat,
                expectFormat,
                actualExtension,
                expectExtension,
                actualFilePath: '/' + vfs.pathRelative(pkgDir, filePath)
              },
              path: ['name'],
              type: 'warning'
            })
          }
        })
      }
      await pq.wait()
    })
  }

  await promiseQueue.wait()

  if (strict) {
    for (const message of messages) {
      if (message.type === 'warning') {
        message.type = 'error'
      }
    }
  }

  if (level === 'warning') {
    return { messages: messages.filter((m) => m.type !== 'suggestion') }
  } else if (level === 'error') {
    return { messages: messages.filter((m) => m.type === 'error') }
  }

  return { messages }

  /**
   * @param {string} path file path to read
   * @param {string[]} [pkgPath] current path that tries to read this file.
   *   pass `undefined` to prevent error reporting if the file is missing.
   * @param {string[]} tryExtensions list of extensions to try before giving up
   * @returns {Promise<string | false>}
   */
  async function readFile(path, pkgPath = undefined, tryExtensions = []) {
    try {
      const content = await vfs.readFile(path)
      if (pkgPath && _packedFiles && !_packedFiles.includes(path)) {
        fileNotPublished(pkgPath)
      }
      return content
    } catch {
      for (let ext of tryExtensions) {
        // remove duplicated slashes
        if (ext[0] === '/' && path[path.length - 1] === '/') {
          ext = ext.slice(1)
        }
        try {
          const content = await vfs.readFile(path + ext)
          if (pkgPath && _packedFiles && !_packedFiles.includes(path + ext)) {
            fileNotPublished(pkgPath)
          }
          return content
        } catch {}
      }
      if (pkgPath) {
        messages.push({
          code: 'FILE_DOES_NOT_EXIST',
          args: {},
          path: pkgPath,
          type: 'error'
        })
      }
      return false
    }
  }

  // https://docs.npmjs.com/cli/v10/configuring-npm/package-json#repository
  /**
   * @param {Record<string, string> | string} repository
   */
  async function checkRepositoryField(repository) {
    if (!ensureTypeOfField(repository, ['string', 'object'], ['repository']))
      return

    if (typeof repository === 'string') {
      // the string field accepts shorthands only. if this doesn't look like a shorthand,
      // and looks like a git URL, recommend using the object form.
      if (!isShorthandRepositoryUrl(repository)) {
        messages.push({
          code: 'INVALID_REPOSITORY_VALUE',
          args: { type: 'invalid-string-shorthand' },
          path: ['repository'],
          type: 'warning'
        })
      }
    } else if (
      typeof repository === 'object' &&
      repository.url &&
      repository.type === 'git'
    ) {
      if (!isGitUrl(repository.url)) {
        messages.push({
          code: 'INVALID_REPOSITORY_VALUE',
          args: { type: 'invalid-git-url' },
          path: ['repository', 'url'],
          type: 'warning'
        })
      } else if (isDeprecatedGitHubGitUrl(repository.url)) {
        messages.push({
          code: 'INVALID_REPOSITORY_VALUE',
          args: { type: 'deprecated-github-git-protocol' },
          path: ['repository', 'url'],
          type: 'suggestion'
        })
      } else if (isShorthandGitHubOrGitLabUrl(repository.url)) {
        messages.push({
          code: 'INVALID_REPOSITORY_VALUE',
          args: { type: 'shorthand-git-sites' },
          path: ['repository', 'url'],
          type: 'suggestion'
        })
      }
    }
  }

  /**
   * @param {string[]} pkgPath
   */
  function fileNotPublished(pkgPath) {
    messages.push({
      code: 'FILE_NOT_PUBLISHED',
      args: {},
      path: pkgPath,
      type: 'error'
    })
  }

  /**
   * @param {string} filePath
   * @param {string[]} currentPath
   * @param {string} [globbedFilePath] only needed for globs
   */
  function hasInvalidJsxExtension(filePath, currentPath, globbedFilePath) {
    const matched = invalidJsxExtensions.find((ext) => filePath.endsWith(ext))
    if (matched) {
      messages.push({
        code: 'FILE_INVALID_JSX_EXTENSION',
        args: {
          actualExtension: matched,
          globbedFilePath
        },
        path: currentPath,
        type: 'error'
      })
      return true
    }
    return false
  }

  /**
   * @param {any} fieldValue
   * @param {('string' | 'number' | 'boolean' | 'object')[]} expectTypes
   * @param {string[]} pkgPath
   */
  function ensureTypeOfField(fieldValue, expectTypes, pkgPath) {
    // @ts-expect-error typeof doesn't need to match `expectedTypes` type but TS panics
    if (!expectTypes.includes(typeof fieldValue)) {
      messages.push({
        code: 'FIELD_INVALID_VALUE_TYPE',
        args: {
          actualType: typeof fieldValue,
          expectTypes
        },
        path: pkgPath,
        type: 'error'
      })
      return false
    }
    return true
  }

  /**
   * @param {string | Record<string, any>} fieldValue
   * @param {string[]} currentPath
   */
  function crawlBrowser(fieldValue, currentPath) {
    if (typeof fieldValue === 'string') {
      promiseQueue.push(async () => {
        const browserPath = vfs.pathJoin(pkgDir, fieldValue)
        await readFile(browserPath, currentPath, ['.js', '/index.js'])
      })
    } else if (typeof fieldValue === 'object') {
      for (const key in fieldValue) {
        crawlBrowser(fieldValue[key], currentPath.concat(key))
      }
    }
  }

  /**
   * @param {string} exportsValue
   */
  async function getExportsFiles(exportsValue) {
    const exportsPath = isRelativePath(exportsValue)
      ? vfs.pathJoin(pkgDir, exportsValue)
      : exportsValue
    const isGlob = exportsValue.includes('*')
    return isGlob
      ? await exportsGlob(exportsPath, vfs, _packedFiles)
      : [exportsPath]
  }

  /**
   * @param {any} exportsValue
   * @param {string[]} currentPath
   * @param {boolean} isAfterNodeCondition
   */
  function crawlExports(
    exportsValue,
    currentPath,
    isAfterNodeCondition = false
  ) {
    if (typeof exportsValue === 'string') {
      promiseQueue.push(async () => {
        // warn deprecated subpath mapping
        // https://nodejs.org/docs/latest-v16.x/api/packages.html#subpath-folder-mappings
        if (exportsValue.endsWith('/')) {
          const expectPath = currentPath.map((part) => {
            return part.endsWith('/') ? part + '*' : part
          })
          const expectPathAlreadyExist = !!getPkgPathValue(rootPkg, expectPath)
          messages.push({
            code: 'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING',
            args: {
              expectPath,
              expectValue: exportsValue + '*'
            },
            path: currentPath,
            // if a trailing glob is also specified, that means this key is for backwards compat only.
            // lower severity to suggestion instead.
            type: expectPathAlreadyExist ? 'suggestion' : 'warning'
          })
          // help fix glob so we can further analyze other issues
          exportsValue += '*'
        }

        // error incorrect exports value
        if (!exportsValue.startsWith('./')) {
          messages.push({
            code: 'EXPORTS_VALUE_INVALID',
            args: {
              suggestValue: './' + exportsValue.replace(/^[\/]+/, '')
            },
            path: currentPath,
            type: 'error'
          })
        }

        const isGlob = exportsValue.includes('*')
        const exportsFiles = await getExportsFiles(exportsValue)

        if (isGlob && !exportsFiles.length) {
          messages.push({
            code: 'EXPORTS_GLOB_NO_MATCHED_FILES',
            args: {},
            path: currentPath,
            type: 'warning'
          })
          return
        }

        // if the exports value matches a key in `pkg.browser` (meaning it'll be remapped
        // if in a browser-ish environment), check if this is a browser-ish environment/condition.
        // if so, warn about this conflict as it's often unexpected behaviour.
        if (typeof browser === 'object' && exportsValue in browser) {
          const browserishCondition = knownBrowserishConditions.find((c) =>
            currentPath.includes(c)
          )
          if (browserishCondition) {
            messages.push({
              code: 'EXPORTS_VALUE_CONFLICTS_WITH_BROWSER',
              args: {
                browserPath: browserPkgPath.concat(exportsValue),
                browserishCondition
              },
              path: currentPath,
              type: 'warning'
            })
          }
        }

        const pq = createPromiseQueue()

        // TODO: group glob warnings
        for (const filePath of exportsFiles) {
          if (
            hasInvalidJsxExtension(
              filePath,
              currentPath,
              isGlob ? './' + vfs.pathRelative(pkgDir, filePath) : undefined
            )
          )
            continue
          // TODO: maybe improve .ts checks in the future
          if (!isFilePathLintable(filePath)) {
            // if not lintable, simply check file existence. only if it's an absolute path,
            // so we avoid linting strings like `std:lib`
            if (isAbsolutePath(filePath)) {
              pq.push(async () => await readFile(filePath, currentPath))
            }
            continue
          }
          pq.push(async () => {
            // could fail if in !isGlob
            const fileContent = await readFile(filePath, currentPath)
            if (fileContent === false) return
            if (!isFileContentLintable(fileContent)) return
            // the `module` condition is only used by bundlers and must be ESM
            if (currentPath.includes('module')) {
              const actualFormat = getCodeFormat(fileContent)
              if (actualFormat === 'CJS') {
                messages.push({
                  code: 'EXPORTS_MODULE_SHOULD_BE_ESM',
                  args: {},
                  path: currentPath,
                  type: 'error'
                })
              }
              return
            }
            // file format checks isn't required for `browser` condition or exports
            // after the node condtion, as nodejs doesn't use it, only bundlers do,
            // which doesn't care of the format
            if (isAfterNodeCondition || currentPath.includes('browser')) return
            const actualFormat = getCodeFormat(fileContent)
            const expectFormat = await getFilePathFormat(filePath, vfs)
            if (
              actualFormat !== expectFormat &&
              actualFormat !== 'unknown' &&
              actualFormat !== 'mixed'
            ) {
              // special case where if the file path contains the keyword "browser" or
              // "bundler", but it has problems. allow skipping the problem if it's ESM.
              const isSafeEsm =
                actualFormat === 'ESM' &&
                (filePath.includes('browser') || filePath.includes('bundler'))
              if (isSafeEsm) return

              const actualExtension = vfs.getExtName(filePath)
              const expectExtension = getCodeFormatExtension(actualFormat)

              // test if the expected extension and file path already exist. if so, skip warning as
              // this invalid format file is probably intentional for other use.
              // NOTE: only relax this for globbed files, as they're implicitly exported.
              if (isGlob) {
                const expectFilePath = replaceLast(
                  filePath,
                  actualExtension,
                  expectExtension
                )
                if (await vfs.isPathExist(expectFilePath)) return
              }

              messages.push({
                code: isExplicitExtension(actualExtension)
                  ? 'FILE_INVALID_EXPLICIT_FORMAT'
                  : 'FILE_INVALID_FORMAT',
                args: {
                  actualFormat,
                  expectFormat,
                  actualExtension,
                  expectExtension,
                  actualFilePath: isGlob
                    ? './' + vfs.pathRelative(pkgDir, filePath)
                    : exportsValue
                },
                path: currentPath,
                type: 'warning'
              })
            }
          })
        }

        await pq.wait()
      })
    }
    // `exports` could be null to disallow exports of globs from another key
    else if (exportsValue) {
      const exportsKeys = Object.keys(exportsValue)

      // the types export should be the first condition
      if ('types' in exportsValue && exportsKeys[0] !== 'types') {
        // check preceding conditions before the `types` condition, if there are nested
        // conditions, check if they also have the `types` condition. If they do, there's
        // a good chance those take precendence over this non-first `types` condition, which
        // is fine and is usually used as fallback instead.
        const precedingKeys = exportsKeys.slice(0, exportsKeys.indexOf('types'))
        let isPrecededByNestedTypesCondition = false
        for (const key of precedingKeys) {
          if (
            typeof exportsValue[key] === 'object' &&
            objectHasKeyNested(exportsValue[key], 'types')
          ) {
            isPrecededByNestedTypesCondition = true
            break
          }
        }
        if (!isPrecededByNestedTypesCondition) {
          messages.push({
            code: 'EXPORTS_TYPES_SHOULD_BE_FIRST',
            args: {},
            path: currentPath.concat('types'),
            type: 'error'
          })
        }
      }

      // if there is a 'require' and a 'module' condition at the same level,
      // then 'module' should always precede 'require'
      if (
        'module' in exportsValue &&
        'require' in exportsValue &&
        exportsKeys.indexOf('module') > exportsKeys.indexOf('require')
      ) {
        messages.push({
          code: 'EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE',
          args: {},
          path: currentPath.concat('module'),
          type: 'error'
        })
      }

      // the default export should be the last condition
      if (
        'default' in exportsValue &&
        exportsKeys[exportsKeys.length - 1] !== 'default'
      ) {
        messages.push({
          code: 'EXPORTS_DEFAULT_SHOULD_BE_LAST',
          args: {},
          path: currentPath.concat('default'),
          type: 'error'
        })
      }

      // keep special state of whether the next `crawlExports` iterations are after a node condition.
      // if there are, we can skip code format check as nodejs doesn't touch them, except bundlers
      // which are fine with any format.
      let isKeyAfterNodeCondition = isAfterNodeCondition
      for (const key of exportsKeys) {
        crawlExports(
          exportsValue[key],
          currentPath.concat(key),
          isKeyAfterNodeCondition
        )
        if (key === 'node') {
          isKeyAfterNodeCondition = true
        }
      }
    }
  }

  function doCheckTypesExported() {
    if (typeof exports === 'string') {
      checkTypesExported()
    } else if (typeof exports === 'object') {
      const exportsKeys = Object.keys(exports)
      if (exportsKeys.length === 0) return

      // check if the `exports` directly map to condition keys (doesn't start with '.').
      // if so, we work on it directly.
      if (!exportsKeys[0].startsWith('.')) {
        checkTypesExported()
      }
      // else this `exports` may have multiple export entrypoints, check for '.'
      // TODO: check for other entrypoints, move logic into `crawlExports`
      else if ('.' in exports) {
        checkTypesExported('.')
      }
    }
  }

  /**
   * @param {string | undefined} exportsRootKey
   */
  function checkTypesExported(exportsRootKey = undefined) {
    promiseQueue.push(async () => {
      const typesFilePath = await findTypesFilePath(exportsRootKey)
      const exportsRootValue = exportsRootKey
        ? exports[exportsRootKey]
        : exports

      // detect if this package intend to ship types
      if (typesFilePath) {
        const exportsPath = exportsRootKey
          ? exportsPkgPath.concat(exportsRootKey)
          : exportsPkgPath

        // keyed strings for seen resolved paths, so we don't trigger duplicate messages for the same thing
        const seenResolvedKeys = new Set()

        // NOTE: got lazy. here we check for the import/require result in different environments
        // to make sure we cover possible cases. however, a better way it to resolve the exports
        // and scan also the possible environment conditions, and return an array instead.
        for (const env of [undefined, 'node', 'browser', 'worker']) {
          for (const format of ['import', 'require']) {
            const result = resolveExports(
              exportsRootValue,
              // @ts-expect-error till this day, ts still doesn't understand `filter(Boolean)`
              ['types', format, env].filter(Boolean),
              exportsPath
            )

            if (!result) continue

            // check if we've seen this resolve before. we also key by format as we want to distinguish
            // incorrect exports, but only when the "exports -> path" contains that format, otherwise
            // it's intentional fallback behaviour by libraries and we don't want to trigger a false alarm.
            // e.g. libraries that only `"exports": "./index.mjs"` means it's ESM only, so we don't key
            // the format, so the next run with `"require"` condition is skipped.
            // different env can share the same key as code can usually be used for multiple environments.
            const seenKey =
              result.path.join('.') + (result.dualPublish ? format : '')
            if (seenResolvedKeys.has(seenKey)) continue
            seenResolvedKeys.add(seenKey)

            const resolvedPath = vfs.pathJoin(pkgDir, result.value)
            // if path doesn't exist, let the missing file error message take over instead
            if (!(await vfs.isPathExist(resolvedPath))) continue

            if (isDtsFile(result.value)) {
              // if we have resolve to a dts file, it might not be ours because typescript requires
              // `.d.mts` and `.d.cts` for esm and cjs (`.js` and nearest type: module behaviour applies).
              // check if we're hitting this case :(
              const dtsActualFormat = await getDtsFilePathFormat(
                resolvedPath,
                vfs
              )

              /** @type {'ESM' | 'CJS' | undefined} */
              let dtsExpectFormat = undefined

              // get the intended format from the conditions without types, e.g. if the adjacent file
              // is a CJS file, despite resolving with the "import" condition, make sure the dts format
              // is expected to be CJS too.
              // only run this if not dual publish since we know dual publish should have both ESM and CJS
              // versions of the dts file, and we don't need to be lenient.
              // NOTE: could there be setups with CJS code and ESM types? seems a bit weird.
              if (!result.dualPublish) {
                const nonTypesResult = resolveExports(
                  exportsRootValue,
                  // @ts-expect-error till this day, ts still doesn't understand `filter(Boolean)`
                  [format, env].filter(Boolean),
                  exportsPath
                )
                if (nonTypesResult?.value) {
                  const nonTypesResolvedPath = vfs.pathJoin(
                    pkgDir,
                    nonTypesResult.value
                  )
                  if (await vfs.isPathExist(nonTypesResolvedPath)) {
                    dtsExpectFormat = await getFilePathFormat(
                      nonTypesResolvedPath,
                      vfs
                    )
                  }
                }
              }

              // fallback if we can't determine the non types format, we base on the condition instead.
              // NOTE: this favours "import" condition over "require" when the library doesn't dual publish
              // because we run "import" first in the for loop.
              if (dtsExpectFormat == null) {
                dtsExpectFormat = format === 'import' ? 'ESM' : 'CJS'
              }

              if (dtsActualFormat !== dtsExpectFormat) {
                messages.push({
                  code: 'EXPORT_TYPES_INVALID_FORMAT',
                  args: {
                    condition: format,
                    actualFormat: dtsActualFormat,
                    expectFormat: dtsExpectFormat,
                    actualExtension: vfs.getExtName(result.value),
                    expectExtension: getDtsCodeFormatExtension(dtsExpectFormat)
                  },
                  path: result.path,
                  type: 'warning'
                })
              }
            } else {
              // adjacent dts file here is always in the correct format
              const hasAdjacentDtsFile = await vfs.isPathExist(
                vfs.pathJoin(pkgDir, getAdjacentDtsPath(result.value))
              )
              // if there's no adjacent dts file, it's likely they don't support moduleResolution: bundler.
              // try to provide a warning.
              if (!hasAdjacentDtsFile) {
                // before we recommend using `typesFilePath` for this export condition, we need to make sure
                // it's of a matching format
                const dtsActualFormat = await getDtsFilePathFormat(
                  vfs.pathJoin(pkgDir, typesFilePath),
                  vfs
                )
                const dtsExpectFormat = format === 'import' ? 'ESM' : 'CJS'
                // if it's a matching format, we can recommend using the types file for this exports condition too.
                // if not, we need to tell them to create a `.d.[mc]ts` file and not use `typesFilePath`.
                // this is signalled in `matchingFormat`, where the message handler should check for it.
                const isMatchingFormat = dtsActualFormat === dtsExpectFormat
                messages.push({
                  code: 'TYPES_NOT_EXPORTED',
                  args: {
                    typesFilePath,
                    actualExtension: isMatchingFormat
                      ? undefined
                      : vfs.getExtName(typesFilePath),
                    expectExtension: isMatchingFormat
                      ? undefined
                      : getDtsCodeFormatExtension(dtsExpectFormat)
                  },
                  path: result.path,
                  type: 'warning'
                })
              }
            }
          }
        }
      }
    })
  }

  /**
   * @param {string | undefined} exportsKey
   */
  async function findTypesFilePath(exportsKey) {
    let typesFilePath
    if (exportsKey == null || exportsKey === '.') {
      const [types] = getPublishedField(rootPkg, 'types')
      const [typings] = getPublishedField(rootPkg, 'typings')
      if (types) {
        typesFilePath = types
      } else if (typings) {
        typesFilePath = typings
      } else if (await readFile(vfs.pathJoin(pkgDir, './index.d.ts'))) {
        typesFilePath = './index.d.ts'
      }
    } else {
      // TODO: handle nested exports key
    }
    return typesFilePath
  }
}
