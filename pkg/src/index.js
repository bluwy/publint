import {
  exportsGlob,
  getCodeFormat,
  getFilePathFormat,
  getCodeFormatExtension,
  isExplicitExtension
} from './utils.js'

/**
 * @param {Required<import('../lib').Options>} options
 * @returns {Promise<import('../lib').Message[]>}
 */
export async function publint({ pkgDir, vfs }) {
  const rootPkgPath = vfs.pathJoin(pkgDir, 'package.json')
  const rootPkgContent = await vfs.readFile(rootPkgPath)
  const rootPkg = JSON.parse(rootPkgContent)

  const { type, main, module, exports } = rootPkg

  const isPkgEsm = type === 'module'

  /** @type {import('../lib').Message[]} */
  const messages = []
  const promiseQueue = createPromiseQueue()

  // Relies on default node resolution
  // https://nodejs.org/api/modules.html#all-together
  // LOAD_INDEX(X)
  if (!main && !module && !exports) {
    promiseQueue.push(async () => {
      // check main.js only, others aren't our problem
      const defaultPath = vfs.pathJoin(pkgDir, 'index.js')
      if (await vfs.isPathExist(defaultPath)) {
        const defaultContent = await vfs.readFile(defaultPath)
        const actualFormat = getCodeFormat(defaultContent)
        const expectFormat = isPkgEsm ? 'ESM' : 'CJS'
        if (actualFormat !== expectFormat && actualFormat !== 'unknown') {
          messages.push({
            code: 'IMPLICIT_INDEX_JS_INVALID_FORMAT',
            args: {
              actualFormat: 'cjs',
              expectFormat
            },
            path: [],
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
  if (main) {
    promiseQueue.push(async () => {
      const mainPath = vfs.pathJoin(pkgDir, main)
      const mainContent = await vfs.readFile(mainPath)
      const actualFormat = getCodeFormat(mainContent)
      const expectFormat = await getFilePathFormat(mainPath, vfs)
      if (actualFormat !== expectFormat && actualFormat !== 'unknown') {
        const actualExtension = vfs.getExtName(mainPath)
        messages.push({
          code: isExplicitExtension(actualExtension)
            ? 'FILE_INVALID_EXPLICIT_FORMAT'
            : 'FILE_INVALID_FORMAT',
          args: {
            actualFormat,
            expectFormat,
            actualExtension,
            expectExtension: getCodeFormatExtension(expectFormat)
          },
          path: ['main'],
          type: 'warning'
        })
      }
      if (expectFormat === 'ESM') {
        messages.push({
          code: 'HAS_ESM_MAIN_BUT_NO_EXPORTS',
          args: {},
          path: ['main'],
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
  if (module) {
    promiseQueue.push(async () => {
      const modulePath = vfs.pathJoin(pkgDir, module)
      const format = await getFilePathFormat(modulePath, vfs)
      if (format === 'CJS') {
        messages.push({
          code: 'MODULE_SHOULD_BE_ESM',
          args: {},
          path: ['module'],
          type: 'error'
        })
      }
      // TODO: Check valid content too?
      if (!exports) {
        messages.push({
          code: 'HAS_MODULE_BUT_NO_EXPORTS',
          args: {},
          path: ['module'],
          type: 'suggestion'
        })
      }
    })
  }

  if (exports) {
    // recursively check exports
    crawlExports(exports)
  }

  await promiseQueue.wait()
  return messages

  function createPromiseQueue() {
    const promises = []
    return {
      push: (fn) => promises.push(fn()),
      wait: () => Promise.all(promises)
    }
  }

  function crawlExports(exports, currentPath = ['exports']) {
    if (typeof exports === 'string') {
      promiseQueue.push(async () => {
        const exportsPath = vfs.pathJoin(pkgDir, exports)
        const isGlob = exports.includes('*')
        const exportsFiles = isGlob
          ? await exportsGlob(exportsPath, vfs)
          : [exportsPath]

        if (isGlob && !exportsFiles.length) {
          messages.push({
            code: 'EXPORTS_GLOB_NO_MATCHED_FILES',
            args: {
              pattern: exports
            },
            path: currentPath,
            type: 'warning'
          })
          return
        }

        const pq = createPromiseQueue()

        // todo: group glob warnings
        for (const filePath of exportsFiles) {
          pq.push(async () => {
            // Could fail if in !isGlob
            const fileContent = await vfs.readFile(filePath)
            const actualFormat = getCodeFormat(fileContent)
            const expectFormat = await getFilePathFormat(filePath, vfs)
            if (actualFormat !== expectFormat && actualFormat !== 'unknown') {
              const actualExtension = vfs.getExtName(filePath)
              messages.push({
                code: isExplicitExtension(actualExtension)
                  ? 'FILE_INVALID_EXPLICIT_FORMAT'
                  : 'FILE_INVALID_FORMAT',
                args: {
                  actualFormat,
                  expectFormat,
                  actualExtension,
                  expectExtension: getCodeFormatExtension(expectFormat),
                  actualFilePath: isGlob
                    ? './' + vfs.pathRelative(pkgDir, filePath)
                    : exports
                },
                path: currentPath,
                type: 'warning'
              })
            }
          })
        }

        await pq.wait()
      })
    } else {
      const exportsKeys = Object.keys(exports)

      // the types export should be the first condition
      if ('types' in exports && exportsKeys[0] !== 'types') {
        messages.push({
          code: 'EXPORTS_TYPES_SHOULD_BE_FIRST',
          args: {},
          path: currentPath,
          type: 'error'
        })
      }

      // the default export should be the last condition
      if (
        'default' in exports &&
        exportsKeys[exportsKeys.length - 1] !== 'default'
      ) {
        messages.push({
          code: 'EXPORTS_DEFAULT_SHOULD_BE_LAST',
          args: {},
          path: currentPath,
          type: 'error'
        })
      }

      for (const key of exportsKeys) {
        crawlExports(exports[key], currentPath.concat(key))
      }
    }
  }
}
