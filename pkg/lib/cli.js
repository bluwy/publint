#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import sade from 'sade'
import c from 'picocolors'
import { publint } from './node.js'
import { printMessage } from '../src/message.js'

// TODO: Handcraft this
sade('publint [dir]', true)
  .version('0.0.1')
  .action(async (dir) => {
    const pkgDir = dir ? path.resolve(dir) : process.cwd()
    const messages = await publint({ pkgDir })
    const rootPkgContent = await fs.readFile(
      path.join(pkgDir, 'package.json'),
      'utf8'
    )
    const rootPkg = JSON.parse(rootPkgContent)

    if (messages.length) {
      const suggestions = messages.filter((v) => v.type === 'suggestion')
      if (suggestions.length) {
        console.log(c.bold(c.blue('Suggestions:')))
        suggestions.forEach((m, i) =>
          console.log(c.dim(`${i + 1}: `) + printMessage(m, rootPkg))
        )
      }

      const warnings = messages.filter((v) => v.type === 'warning')
      if (warnings.length) {
        console.log(c.bold(c.yellow('Warnings:')))
        warnings.forEach((m, i) =>
          console.log(c.dim(`${i + 1}: `) + printMessage(m, rootPkg))
        )
      }

      const errors = messages.filter((v) => v.type === 'error')
      if (errors.length) {
        console.log(c.bold(c.red('Errors:')))
        errors.forEach((m, i) =>
          console.log(c.dim(`${i + 1}: `) + printMessage(m, rootPkg))
        )
      }
    } else {
      console.log(c.bold(c.green('all good')))
    }
  })
  .parse(process.argv)
