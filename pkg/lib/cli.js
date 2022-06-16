#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import sade from 'sade'
import c from 'picocolors'
import { publint } from './node.js'
import { printMessage } from '../src/message.js'

const version = createRequire(import.meta.url)('../package.json').version

sade('publint [dir]', true)
  .version(version)
  .action(async (dir) => {
    const pkgDir = dir ? path.resolve(dir) : process.cwd()
    const rootPkgContent = await fs
      .readFile(path.join(pkgDir, 'package.json'), 'utf8')
      .catch(() => {
        console.log(c.red(`Unable to read package.json at ${pkgDir}`))
      })
    if (!rootPkgContent) return
    const rootPkg = JSON.parse(rootPkgContent)
    const messages = await publint({ pkgDir })

    console.log(`${c.bold(rootPkg.name)} lint results:`)

    if (messages.length) {
      const suggestions = messages.filter((v) => v.type === 'suggestion')
      if (suggestions.length) {
        console.log(c.bold(c.blue('Suggestions:')))
        suggestions.forEach((m, i) =>
          console.log(c.dim(`${i + 1}. `) + printMessage(m, rootPkg))
        )
      }

      const warnings = messages.filter((v) => v.type === 'warning')
      if (warnings.length) {
        console.log(c.bold(c.yellow('Warnings:')))
        warnings.forEach((m, i) =>
          console.log(c.dim(`${i + 1}. `) + printMessage(m, rootPkg))
        )
      }

      const errors = messages.filter((v) => v.type === 'error')
      if (errors.length) {
        console.log(c.bold(c.red('Errors:')))
        errors.forEach((m, i) =>
          console.log(c.dim(`${i + 1}. `) + printMessage(m, rootPkg))
        )
      }

      process.exitCode = 1
    } else {
      console.log(c.bold(c.green('All good!')))
    }
  })
  .parse(process.argv)
