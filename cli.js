#!/usr/bin/env node

import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import sade from 'sade'
import c from 'picocolors'

sade('puba [dir]', true)
  .version('0.0.1')
  .action((dir, opts) => {
    main(dir ? path.resolve(dir) : process.cwd())
  })
  .parse(process.argv)

/**
 * @param {string} dir
 */
async function main(dir) {
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
      warnings.push(`main should be ${format}`)
    }
    if (format === 'esm') {
      warnings.push(`consider using exports instead of main`)
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
      warnings.push(`module should be esm`)
    }
    if (!isCodeMatchingFormat(moduleContent, format)) {
      warnings.push(`module should be ${format}`)
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
      const filePath = path.resolve(dir, exports)
      const fileContent = await expectReadFile(
        filePath,
        () =>
          `${c.bold(`pkg.${currentPath}`)} is ${c.bold(
            exports
          )} but file does not exist`
      )
      if (fileContent === false) return
      const format = await getFilePathFormat(filePath)
      if (!isCodeMatchingFormat(fileContent, format)) {
        warnings.push(`exports should be ${format}`)
      }
    } else {
      // todo: check ordering? and types? (default should be last, types should be first)
      for (const key of Object.keys(exports)) {
        await crawlExports(exports[key], currentPath + '.' + key)
      }
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

function isCodeMatchingFormat(code, format) {
  return format === 'esm' ? isCodeEsm(code) : isCodeCjs(code)
}

function isCodeEsm(code) {
  return !isCodeCjs(code)
}

const CJS_CONTENT_RE =
  /\bmodule\.exports\b|\bexports[.\[]|\brequire\s*\(|\bObject\.(defineProperty|defineProperties|assign)\s*\(\s*exports\b/

function isCodeCjs(code) {
  return CJS_CONTENT_RE.test(code)
}
