#!/usr/bin/env node

import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import sade from 'sade'
import c from 'picocolors'
import { publint } from './index-node.js'
import { formatMessage } from './node/message.js'
import { createPromiseQueue } from './shared/utils.js'

const version = createRequire(import.meta.url)('../package.json').version
const cli = sade('publint', false)
  .version(version)
  .option(
    '--level',
    `Level of messages to log ('suggestion' | 'warning' | 'error')`,
    'suggestion',
  )
  .option(
    '--pack',
    `Package manager to use for packing ('auto' | 'npm' | 'yarn' | 'pnpm' | 'bun' | false)`,
    'auto',
  )
  .option('--strict', `Report warnings as errors`, false)

cli
  .command('run [dir]', 'Lint a directory (defaults to current directory)', {
    default: true,
  })
  .action(async (dir, opts) => {
    opts = normalizeOpts(opts)

    const pkgDir = dir ? path.resolve(dir) : process.cwd()
    const packageJson = await getPackageJson(pkgDir).catch(() => {
      console.log(c.red(`Unable to read package.json at ${pkgDir}`))
      process.exitCode = 1
    })
    if (packageJson == null) return
    const { pkgName, pkgJson } = packageJson

    console.log(
      `Running ${c.bold(`publint v${version}`)} for ${c.bold(pkgName)}...`,
    )

    const { messages } = await publint({
      pkgDir,
      level: opts.level,
      strict: opts.strict,
      pack: opts.pack,
      // @ts-expect-error internal property to log packing progress
      _log: true,
    })
    if (messages.length === 0) {
      console.log(c.bold(c.green('All good!')))
    } else {
      formatMessages(messages, pkgJson).forEach((l) => console.log(l))
    }
  })

cli
  .command('deps [dir]', 'Lint dependencies declared in package.json')
  .option('-P, --prod', 'Only check dependencies')
  .option('-D, --dev', 'Only check devDependencies')
  .action(async (dir, opts) => {
    opts = normalizeOpts(opts)

    const pkgDir = dir ? path.resolve(dir) : process.cwd()
    const packageJson = await getPackageJson(pkgDir).catch(() => {
      console.log(c.red(`Unable to read package.json at ${pkgDir}`))
      process.exitCode = 1
    })
    if (packageJson == null) return
    const { pkgName, pkgJson } = packageJson

    console.log(
      `Running ${c.bold(`publint v${version}`)} for ${c.bold(pkgName)} deps...`,
    )

    /** @type {string[]} */
    const deps = []
    if (!opts.dev) deps.push(...Object.keys(pkgJson.dependencies || {}))
    if (!opts.prod) deps.push(...Object.keys(pkgJson.devDependencies || {}))

    if (deps.length === 0) {
      console.log(c.yellow('No dependencies found'))
      return
    }

    let hasMessages = false

    const pq = createPromiseQueue()
    let waitingDepIndex = 0
    /** @type {Function[]} */
    const waitingDepIndexListeners = []
    /**
     * @param {Function} cb
     */
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
        /** @type {Function} */
        let log = () => {
          waitingDepIndex++
          waitingDepIndexListeners.forEach((cb) => cb())
        }

        if (depDir) {
          const depPackageJson = await getPackageJson(depDir).catch(() => {
            console.log(c.red(`Unable to read package.json at ${depDir}`))
            process.exitCode = 1
          })
          if (depPackageJson) {
            const { pkgName: depPkgName, pkgJson: depPkgJson } = depPackageJson
            const { messages } = await publint({
              pkgDir: depDir,
              level: opts.level,
              strict: opts.strict,
              // Linting dependencies in node_modules also means that the dependency
              // is already packed, so we don't need to pack it again by passing `false`.
              // Otherwise if it's a local-linked dependency, we use the pack option.
              pack: depDir.includes('node_modules') ? false : opts.pack,
            })
            const logs = formatMessages(messages, depPkgJson)
            if (messages.length > 0) {
              logs.unshift(c.bold(`${c.red('x')} ${depPkgName}`))
              logs.push('') // insert new line so easier to read
              hasMessages = true
            }

            log = () => {
              logs.forEach((l) => console.log(l))
              waitingDepIndex++
              waitingDepIndexListeners.forEach((cb) => cb())
            }
          }
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

    if (!hasMessages) {
      console.log(c.bold(c.green('All good!')))
    }
  })

cli.parse(process.argv)

/**
 * @param {string} pkgDir
 */
async function getPackageJson(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, 'package.json')
  const rootPkgContent = await fs.readFile(pkgJsonPath, 'utf8')
  const pkgJson = JSON.parse(rootPkgContent)
  /** @type {string} */
  const pkgName = pkgJson.name || path.basename(pkgDir)
  return { pkgName, pkgJson }
}

/**
 *
 * @param {import('./index.d.ts').Message[]} messages
 * @param {any} pkgJson
 */
function formatMessages(messages, pkgJson) {
  /** @type {string[]} */
  const logs = []

  const errors = messages.filter((v) => v.type === 'error')
  if (errors.length) {
    logs.push(c.bold(c.red('Errors:')))
    errors.forEach((m, i) =>
      logs.push(c.dim(`${i + 1}. `) + formatMessage(m, pkgJson)),
    )
    process.exitCode = 1
  }

  const warnings = messages.filter((v) => v.type === 'warning')
  if (warnings.length) {
    logs.push(c.bold(c.yellow('Warnings:')))
    warnings.forEach((m, i) =>
      logs.push(c.dim(`${i + 1}. `) + formatMessage(m, pkgJson)),
    )
  }

  const suggestions = messages.filter((v) => v.type === 'suggestion')
  if (suggestions.length) {
    logs.push(c.bold(c.blue('Suggestions:')))
    suggestions.forEach((m, i) =>
      logs.push(c.dim(`${i + 1}. `) + formatMessage(m, pkgJson)),
    )
  }

  return logs
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

/**
 * @param {any} opts
 */
function normalizeOpts(opts) {
  if (opts.pack === 'false') opts.pack = false
  return opts
}
