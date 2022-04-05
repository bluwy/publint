import c from 'picocolors'
import { printMessage } from './message.js'
import {
  isCodeMatchingFormat,
  exportsGlob,
  getCodeFormat,
  getFilePathFormat
} from './utils.js'

/**
 * @param {Required<import('types').Options>} options
 * @returns {Promise<import('types').Message[]>}
 */
export async function publint({ pkgDir, vfs }) {
  const rootPkgPath = vfs.pathJoin(pkgDir, 'package.json')
  const rootPkgContent = await vfs.readFile(rootPkgPath)
  const rootPkg = JSON.parse(rootPkgContent)

  const { type, main, module, exports } = rootPkg

  const isPkgEsm = type === 'module'

  /** @type {import('types').Message[]} */
  let messages = []
  let warnings = []

  /**
   * @param {import('types').Message} msg
   */
  function addMessage(msg) {
    messages.push(msg)
  }

  // Relies on default node resolution
  // https://nodejs.org/api/modules.html#all-together
  // LOAD_INDEX(X)
  if (!main && !module && !exports) {
    // check main.js only, others aren't our problem
    const defaultPath = vfs.pathJoin(pkgDir, 'index.js')
    if (await vfs.isPathExist(defaultPath)) {
      const defaultContent = await vfs.readFile(defaultPath)
      const actualFormat = getCodeFormat(defaultContent)
      const expectFormat = isPkgEsm ? 'ESM' : 'CJS'
      if (actualFormat !== expectFormat && actualFormat !== 'unknown') {
        addMessage({
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
    return
  }

  /**
   * Rules for main:
   * - It's mostly used for CJS
   * - It can be used for ESM, but if you're doing so, might as well use exports
   */
  if (main) {
    const mainPath = vfs.pathResolve(pkgDir, main)
    const mainContent = await vfs.readFile(mainPath)
    const actualFormat = getCodeFormat(mainContent)
    const expectFormat = await getFilePathFormat(mainPath, vfs)
    if (actualFormat !== expectFormat && actualFormat !== 'unknown') {
      addMessage({
        code: 'FILE_INVALID_FORMAT',
        args: {
          actualFormat,
          expectFormat
        },
        path: ['main'],
        type: 'warning'
      })
    }
    if (expectFormat === 'ESM') {
      addMessage({
        code: 'HAS_ESM_MAIN_BUT_NO_EXPORTS',
        args: {},
        path: ['main'],
        type: 'suggestion'
      })
    }
  }

  /**
   * Rules for module:
   * - Bundler-specific
   * - Is not a way to support dual packages in NodeJS
   * - Should be MJS always!!
   */
  if (module) {
    const modulePath = vfs.pathResolve(pkgDir, module)
    const format = await getFilePathFormat(modulePath, vfs)
    if (format === 'CJS') {
      addMessage({
        code: 'MODULE_SHOULD_BE_ESM',
        args: {},
        path: ['module'],
        type: 'error'
      })
    }
    // TODO: Check valid content too?
    if (!exports) {
      addMessage({
        code: 'HAS_MODULE_BUT_NO_EXPORTS',
        args: {},
        path: ['module'],
        type: 'suggestion'
      })
    }
  }

  if (exports) {
    // recursively check exports
    await crawlExports(exports)
  }

  if (messages.length) {
    console.log(c.bold(c.yellow('Suggestions:')))
    messages
      .filter((v) => v.type === 'suggestion')
      .forEach((m, i) =>
        console.log(c.dim(`${i + 1}: `) + printMessage(m, rootPkg))
      )

    console.log(c.bold(c.yellow('Warnings:')))
    messages
      .filter((v) => v.type === 'warning')
      .forEach((m, i) =>
        console.log(c.dim(`${i + 1}: `) + printMessage(m, rootPkg))
      )

    console.log(c.bold(c.yellow('Errors:')))
    messages
      .filter((v) => v.type === 'error')
      .forEach((m, i) =>
        console.log(c.dim(`${i + 1}: `) + printMessage(m, rootPkg))
      )
  } else {
    console.log('all good')
  }

  async function crawlExports(exports, currentPath = ['exports']) {
    if (typeof exports === 'string') {
      const exportsPath = vfs.pathResolve(pkgDir, exports)
      const isGlob = exports.includes('*')
      const exportsFiles = isGlob
        ? await exportsGlob(exportsPath, vfs)
        : [exportsPath]

      if (isGlob && !exportsFiles.length) {
        addMessage({
          code: 'EXPORTS_GLOB_NO_MATCHED_FILES',
          args: {
            pattern: exports
          },
          path: currentPath,
          type: 'warning'
        })
        return
      }

      // todo: group glob warnings
      for (const filePath of exportsFiles) {
        const fileContent = await expectReadFile(filePath, () => {
          // Should only happen in !isGlob
          // prettier-ignore
          return `${c.bold(`pkg.${currentPath}`)} is ${c.bold(exports)} but file does not exist`
        })
        if (fileContent === false) return
        const format = await getFilePathFormat(filePath)
        expectCodeToBeFormat(fileContent, format, () => {
          const inverseFormat = format === 'ESM' ? 'cjs' : 'esm'
          const formatExtension = format === 'ESM' ? '.mjs' : '.cjs'
          const inverseFormatExtension = format === 'ESM' ? '.cjs' : '.mjs'
          const is = isGlob ? 'matches' : 'is'
          const relativeExports = isGlob
            ? './' + vfs.pathRelative(pkgDir, filePath)
            : exports
          if (filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
            // prettier-ignore
            return `${c.bold(`pkg.${currentPath}`)} ${is} ${c.bold(relativeExports)} which ends with the ${c.yellow(vfs.getExtName(exports))} extension, but the code is written in ${c.yellow(inverseFormat.toUpperCase())}. Consider re-writting the code to ${c.yellow(format.toUpperCase())}, or use the ${c.yellow(formatExtension)} extension, e.g. ${c.bold(exports.replace(vfs.getExtName(exports), formatExtension))}`
          } else {
            // prettier-ignore
            return `${c.bold(`pkg.${currentPath}`)} ${is} ${c.bold(relativeExports)} and is detected to be ${c.yellow(format.toUpperCase())}, but the code is written in ${c.yellow(inverseFormat.toUpperCase())}. Consider re-writting the code to ${c.yellow(format.toUpperCase())}, or use the ${c.yellow(inverseFormatExtension)} extension, e.g. ${c.bold(exports.replace(vfs.getExtName(exports), inverseFormatExtension))}`
          }
        })
      }
    } else {
      const exportsKeys = Object.keys(exports)

      // the types export should be the first condition
      if ('types' in exports && exportsKeys[0] !== 'types') {
        addMessage({
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
        addMessage({
          code: 'EXPORTS_DEFAULT_SHOULD_BE_LAST',
          args: {},
          path: currentPath,
          type: 'error'
        })
      }

      for (const key of exportsKeys) {
        await crawlExports(exports[key], currentPath.concat(key))
      }
    }
  }

  async function expectCodeToBeFormat(code, format, msg) {
    if (!isCodeMatchingFormat(code, format)) {
      warnings.push(msg())
      return false
    }
  }

  async function expectReadFile(filePath, msg) {
    try {
      return await vfs.readFile(filePath)
    } catch {
      warnings.push(msg())
      return false
    }
  }
}
