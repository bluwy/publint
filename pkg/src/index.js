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
  /** @type {import('../lib').Message[]} */
  const messages = []
  const promiseQueue = createPromiseQueue()

  const rootPkgPath = vfs.pathJoin(pkgDir, 'package.json')
  const rootPkgContent = await readFile(rootPkgPath, [])
  if (rootPkgContent === false) return messages
  const rootPkg = JSON.parse(rootPkgContent)
  const { main, module, exports } = rootPkg

  /**
   * @param {string} path
   * @param {string[]} pkgPath
   * @param {string[]} tryExtensions
   * @returns {Promise<string | false>}
   */
  async function readFile(path, pkgPath, tryExtensions = []) {
    try {
      return await vfs.readFile(path)
    } catch {
      for (const ext of tryExtensions) {
        try {
          return await vfs.readFile(path + ext)
        } catch {}
      }
      messages.push({
        code: 'FILE_DOES_NOT_EXIST',
        args: { filePath: path },
        path: pkgPath,
        type: 'error'
      })
      return false
    }
  }

  // Relies on default node resolution
  // https://nodejs.org/api/modules.html#all-together
  // LOAD_INDEX(X)
  if (!main && !module && !exports) {
    promiseQueue.push(async () => {
      // check index.js only, others aren't our problem
      const defaultPath = vfs.pathJoin(pkgDir, 'index.js')
      if (await vfs.isPathExist(defaultPath)) {
        const defaultContent = await readFile(defaultPath, [])
        if (defaultContent === false) return
        const actualFormat = getCodeFormat(defaultContent)
        const expectFormat = await getFilePathFormat(defaultPath, vfs)
        if (actualFormat !== expectFormat && actualFormat !== 'unknown') {
          messages.push({
            code: 'IMPLICIT_INDEX_JS_INVALID_FORMAT',
            args: {
              actualFormat,
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
      const mainContent = await readFile(
        mainPath,
        ['main'],
        ['.js', '/index.js']
      )
      if (mainContent === false) return
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
            expectExtension: getCodeFormatExtension(actualFormat)
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
      const moduleContent = await readFile(
        modulePath,
        ['module'],
        ['.js', '/index.js']
      )
      if (moduleContent === false) return
      const actualFormat = getCodeFormat(moduleContent)
      if (actualFormat === 'CJS') {
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
          if (filePath.endsWith('.d.ts')) continue
          pq.push(async () => {
            // Could fail if in !isGlob
            const fileContent = await readFile(filePath, currentPath)
            if (fileContent === false) return
            const actualFormat = getCodeFormat(fileContent)
            let expectFormat = await getFilePathFormat(filePath, vfs)
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
                  expectExtension: getCodeFormatExtension(actualFormat),
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
          path: currentPath.concat('types'),
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
          path: currentPath.concat('default'),
          type: 'error'
        })
      }

      for (const key of exportsKeys) {
        if (key === 'types') continue
        crawlExports(exports[key], currentPath.concat(key))
      }
    }
  }
}
