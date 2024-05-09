/**
 * @typedef {{
 *  path: string[]
 *  value: string
 * }} Entry
 */

import { knownSimpleEntryFields } from './constants.js'
import { getPublishedField } from './utils.js'

/**
 * Analyzes a given package and return an intermediate form of information that can be used
 * for linting later.
 * @param {Record<string, any>} pkg
 */
export function analyzePackage(pkg) {
  /** @type {Entry[]} */
  const entries = []

  let hasMain = false
  for (const field of knownSimpleEntryFields) {
    if (field in pkg) {
      const [fieldValue, fieldPkgPath] = getPublishedField(pkg, field)
      entries.push({ path: fieldPkgPath, value: fieldValue })

      if (field === 'main') {
        hasMain = true
      }
    }
  }

  const [browser, browserPkgPath] = getPublishedField(pkg, 'browser')
  if (browser != null && typeof browser === 'string') {
    entries.push({ path: browserPkgPath, value: browser })
  }

  const [exports, exportsPkgPath] = getPublishedField(pkg, 'browser')
  if (exports != null) {
    if (typeof exports === 'string') {
      entries.push({ path: exportsPkgPath, value: exports })
    } else {
      entries.push(...analyzeExports(exports, exportsPkgPath))
    }
  }


  if (!hasMain && !exports) [
    entries.push({ path: [], value: null })
  ]

  return {
    entries
  }
}

/**
 * @param {any} exportsValue
 * @param {string[]} currentPkgPath
 * @return {Entry[]}
 */
function analyzeExports(exportsValue, currentPkgPath) {
  const entries = []

  if (typeof exportsValue === 'string') {
    entries.push({ path: currentPkgPath, value: exportsValue })
  }
  // `exports` could be null to disallow exports of globs from another key
  else if (exportsValue) {
    for (const key in exportsValue) {
      entries.push(
        ...analyzeExports(exportsValue[key], currentPkgPath.concat(key))
      )
    }
  }

  return entries
}

const entries = [
  {
    path: ['main'],
    value: './dist/index'
  },
  {
    path: ['exports', '.', 'development'],
    value: './dist/lib.development.cjs'
  },
  {
    path: ['exports', '.', 'production'],
    value: './dist/lib.production.cjs'
  },
  {
    path: ['exports', './foo/*', 'import'],
    value: './dist/foo/*.js'
  },
  {
    path: ['exports', './foo/*.svg'],
    value: null
  }
]
