#!/usr/bin/env node

import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import sade from 'sade'
import c from 'picocolors'
import { publint } from './node.js'
import { printMessage } from '../src/message.js'
import { createPromiseQueue } from '../src/utils.js'

const version = createRequire(import.meta.url)('../package.json').version
const cli = sade('publint', false)
  .version(version)
  .option(
    '--level',
    `Level of messages to log ('suggestion' | 'warning' | 'error')`,
    'suggestion'
  )
  .option('--strict', `Report warnings as errors`, false)

cli
  .command('run [dir]', 'Lint a directory (defaults to current directory)', {
    default: true
  })
  .action(async (dir, opts) => {
    const pkgDir = dir ? path.resolve(dir) : process.cwd()
    const logs = await lintDir(pkgDir, opts.level, opts.strict)
    logs.forEach((l) => console.log(l))
  })

cli
  .command('deps [dir]', 'Lint dependencies declared in package.json')
  .option('-P, --prod', 'Only check dependencies')
  .option('-D, --dev', 'Only check devDependencies')
  .action(async (dir, opts) => {
    const pkgDir = dir ? path.resolve(dir) : process.cwd()
    const rootPkgContent = await fs
      .readFile(path.join(pkgDir, 'package.json'), 'utf8')
      .catch(() => {
        console.log(c.red(`Unable to read package.json at ${pkgDir}`))
        process.exitCode = 1
      })
    if (!rootPkgContent) return

    const rootPkg = JSON.parse(rootPkgContent)
    /** @type {string[]} */
    const deps = []
    if (!opts.dev) deps.push(...Object.keys(rootPkg.dependencies || {}))
    if (!opts.prod) deps.push(...Object.keys(rootPkg.devDependencies || {}))

    if (deps.length === 0) {
      console.log(c.yellow('No dependencies found'))
      return
    }

    const pq = createPromiseQueue()
    let waitingDepIndex = 0
    const waitingDepIndexListeners = []
    const listenWaitingDepIndex = (cb) => {
      waitingDepIndexListeners.push(cb)
      // unlisten
      return () => {
        const i = waitingDepIndexListeners.indexOf(cb)
        if (i > -1) waitingDepIndexListeners.splice(i, 1)
      }
    }

    // lint deps in parallel, but log results in order asap
    for (let i = 0; i < deps.length; i++) {
      pq.push(async () => {
        const depDir = await findDepPath(deps[i], pkgDir)
        const logs = depDir ? await lintDir(depDir, opts.level, opts.strict, true) : []
        // log this lint result
        const log = () => {
          logs.forEach((l, j) => console.log((j > 0 ? '  ' : '') + l))
          waitingDepIndex++
          waitingDepIndexListeners.forEach((cb) => cb())
        }
        // log when it's our turn so that the results are ordered alphabetically,
        // though all deps are linted in parallel
        if (waitingDepIndex === i) {
          log()
        } else {
          const unlisten = listenWaitingDepIndex(() => {
            if (waitingDepIndex === i) {
              log()
              unlisten()
            }
          })
        }
      })
    }

    await pq.wait()
  })

cli.parse(process.argv)

/**
 * @param {string} pkgDir
 * @param {import('../index.js').Options['level']} level
 * @param {import('../index.js').Options['strict']} strict
 * @param {boolean} [compact]
 */
async function lintDir(pkgDir, level, strict, compact = false) {
  /** @type {string[]} */
  const logs = []

  const rootPkgContent = await fs
    .readFile(path.join(pkgDir, 'package.json'), 'utf8')
    .catch(() => {
      logs.push(c.red(`Unable to read package.json at ${pkgDir}`))
      process.exitCode = 1
    })
  if (!rootPkgContent) return logs
  const rootPkg = JSON.parse(rootPkgContent)
  const pkgName = rootPkg.name || path.basename(pkgDir)
  const messages = await publint({ pkgDir, level, strict })

  if (messages.length) {
    const suggestions = messages.filter((v) => v.type === 'suggestion')
    if (suggestions.length) {
      logs.push(c.bold(c.blue('Suggestions:')))
      suggestions.forEach((m, i) =>
        logs.push(c.dim(`${i + 1}. `) + printMessage(m, rootPkg))
      )
    }

    const warnings = messages.filter((v) => v.type === 'warning')
    if (warnings.length) {
      logs.push(c.bold(c.yellow('Warnings:')))
      warnings.forEach((m, i) =>
        logs.push(c.dim(`${i + 1}. `) + printMessage(m, rootPkg))
      )
    }

    const errors = messages.filter((v) => v.type === 'error')
    if (errors.length) {
      logs.push(c.bold(c.red('Errors:')))
      errors.forEach((m, i) =>
        logs.push(c.dim(`${i + 1}. `) + printMessage(m, rootPkg))
      )
      process.exitCode = 1
    }

    if (compact) {
      logs.unshift(`${c.red('x')} ${c.bold(pkgName)}`)
    } else {
      logs.unshift(`${c.bold(pkgName)} lint results:`)
    }

    return logs
  } else {
    if (compact) {
      logs.unshift(`${c.green('✓')} ${c.bold(pkgName)}`)
    } else {
      logs.unshift(`${c.bold(pkgName)} lint results:`)
      logs.push(c.bold(c.green('All good!')))
    }

    return logs
  }
}

/** @type {import('pnpapi')} */
let pnp
if (process.versions.pnp) {
  try {
    const { createRequire } = (await import('module')).default
    pnp = createRequire(import.meta.url)('pnpapi')
  } catch {}
}

/**
 * @param {string} dep
 * @param {string} parent
 */
async function findDepPath(dep, parent) {
  if (pnp) {
    const depRoot = pnp.resolveToUnqualified(dep, parent)
    if (!depRoot) return undefined
  } else {
    const depRoot = path.join(parent, 'node_modules', dep)
    try {
      await fs.access(depRoot)
      return fsSync.realpathSync(depRoot)
    } catch {
      return undefined
    }
  }
}
