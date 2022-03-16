import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import c from 'picocolors'
import { isCodeMatchingFormat, exportsGlob } from './utils.js'

/**
 * @typedef {{
 *   dir: string,
 *   vfs: import('./vfs').Vfs
 * }} Options
 */

/**
 * @param {Options} options
 */
export async function puba({ dir, vfs }) {
  const rootPkgPath = path.join(dir, 'package.json')
  const rootPkgContent = await fsp.readFile(rootPkgPath, 'utf8')
  const rootPkg = JSON.parse(rootPkgContent)

  const { type, main, module, exports } = rootPkg

  const isPkgEsm = type === 'module'

  let warnings = []

  // Relies on default node resolution
  // https://nodejs.org/api/modules.html#all-together
  // LOAD_INDEX(X)
  if (!main && !module && !exports) {
    // check main.js only, others aren't our problem
    const defaultPath = path.join(dir, 'index.js')
    if (fs.existsSync(defaultPath)) {
      const defaultContent = fsp.readFile(defaultPath, 'utf8')
      const expectedFormat = isPkgEsm ? 'esm' : 'cjs'
      if (!isCodeMatchingFormat(defaultContent, expectedFormat)) {
        warnings.push(`index.js should be ${expectedFormat}`)
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
    const mainPath = path.resolve(dir, main)
    const mainContent = await fsp.readFile(mainPath, 'utf8')
    const format = await getFilePathFormat(mainPath)
    if (!isCodeMatchingFormat(mainContent, format)) {
      warnings.push(`${c.bold('pkg.main')} should be ${format}`)
    }
    if (format === 'esm') {
      // prettier-ignore
      warnings.push(`${c.bold('pkg.main')} is an ESM file, but it is usually better to use ${c.bold('pkg.exports')} instead, and remove ${c.bold('pkg.main')} alongside, as compatible NodeJS versions support is as well.`)
    }
  }

  /**
   * Rules for module:
   * - Bundler-specific
   * - Is not a way to support dual packages in NodeJS
   * - Should be MJS always!!
   */
  if (module) {
    const modulePath = path.resolve(dir, module)
    const moduleContent = await fsp.readFile(modulePath, 'utf8')
    const format = await getFilePathFormat(modulePath)
    if (format !== 'esm') {
      // TODO: Note how we know this. By extension? Content?
      // prettier-ignore
      warnings.push(`${c.bold('pkg.module')} should be ESM, but the code is written in CJS.`)
    }
    if (!isCodeMatchingFormat(moduleContent, format)) {
      warnings.push(`module should be ${format}`)
    }
    if (!exports) {
      // TODO: Code example (better if copy-pastable) (maybe auto fix?)
      // prettier-ignore
      warnings.push(`${c.bold('pkg.module')} is used for ESM output, but ${c.bold('pkg.exports')} is not defined. This would not work for NodeJS as it does not read ${c.bold('pkg.module')}, the field is read by bundlers like Rollup and Webpack only. Consider adding ${c.bold('pkg.export')} to export the ESM output too. Usually ${c.bold('pkg.module')} can be removed alongside too.`)
    }
  }

  if (exports) {
    // recursively check exports
    await crawlExports(exports)
  }

  if (warnings.length) {
    console.log(c.bold(c.yellow('Warnings:')))
    warnings.forEach((w, i) => console.log(c.dim(`${i + 1}: `) + w))
  } else {
    console.log('all good')
  }

  async function getFilePathFormat(filePath) {
    if (filePath.endsWith('.mjs')) return 'esm'
    if (filePath.endsWith('.cjs')) return 'cjs'
    const nearestPkg = await getNearestPkg(filePath)
    return nearestPkg.type === 'module' ? 'esm' : 'cjs'
  }

  async function getNearestPkg(filePath) {
    let currentDir = path.dirname(filePath)
    while (currentDir !== dir) {
      const pkgJsonPath = path.join(currentDir, 'package.json')
      if (fs.existsSync(pkgJsonPath))
        return JSON.parse(fs.readFile(pkgJsonPath, 'utf8'))
      currentDir = path.dirname(currentDir)
    }
    return rootPkg
  }

  async function crawlExports(exports, currentPath = 'exports') {
    if (typeof exports === 'string') {
      const exportsPath = path.resolve(dir, exports)
      const isGlob = exports.includes('*')
      const exportsFiles = isGlob
        ? await exportsGlob(exportsPath, vfs)
        : [exportsPath]

      if (isGlob && !exportsFiles.length) {
        // prettier-ignore
        warnings.push(`${c.bold(`pkg.${currentPath}`)} is ${c.bold(exports)} but does not match any files`)
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
          const inverseFormat = format === 'esm' ? 'cjs' : 'esm'
          const formatExtension = format === 'esm' ? '.mjs' : '.cjs'
          const inverseFormatExtension = format === 'esm' ? '.cjs' : '.mjs'
          const is = isGlob ? 'matches' : 'is'
          const relativeExports = isGlob
            ? './' + path.relative(dir, filePath)
            : exports
          if (filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
            // prettier-ignore
            return `${c.bold(`pkg.${currentPath}`)} ${is} ${c.bold(relativeExports)} which ends with the ${c.yellow(path.extname(exports))} extension, but the code is written in ${c.yellow(inverseFormat.toUpperCase())}. Consider re-writting the code to ${c.yellow(format.toUpperCase())}, or use the ${c.yellow(formatExtension)} extension, e.g. ${c.bold(exports.replace(path.extname(exports), formatExtension))}`
          } else {
            // prettier-ignore
            return `${c.bold(`pkg.${currentPath}`)} ${is} ${c.bold(relativeExports)} and is detected to be ${c.yellow(format.toUpperCase())}, but the code is written in ${c.yellow(inverseFormat.toUpperCase())}. Consider re-writting the code to ${c.yellow(format.toUpperCase())}, or use the ${c.yellow(inverseFormatExtension)} extension, e.g. ${c.bold(exports.replace(path.extname(exports), inverseFormatExtension))}`
          }
        })
      }
    } else {
      const exportsKeys = Object.keys(exports)

      // the types export should be the first condition
      if ('types' in exports && exportsKeys[0] !== 'types') {
        // prettier-ignore
        warnings.push(`${c.bold(`pkg.${currentPath}.types`)} should be the first in the object so TypeScript can load it.`)
      }

      // the default export should be the last condition
      if (
        'default' in exports &&
        exportsKeys[exportsKeys.length - 1] !== 'default'
      ) {
        // prettier-ignore
        warnings.push(`${c.bold(`pkg.${currentPath}.default`)} should be the last in the object so it doesn't take precedence over the keys following it.`)
      }

      for (const key of exportsKeys) {
        await crawlExports(
          exports[key],
          currentPath === 'export'
            ? `export["${key}"]`
            : `${currentPath} > ${key}`
        )
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
      return await fsp.readFile(filePath, 'utf8')
    } catch {
      warnings.push(msg())
      return false
    }
  }
}

/**
 * @typedef {{
 *   name: string,
 *   main: string,
 *   module: string,
 *   exports: Record<string, string>
 * }} Pkg
 */
