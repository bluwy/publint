#!/usr/bin/env node

import path from 'path'
import sade from 'sade'
import { publint } from './node.js'

// TODO: Handcraft this
sade('publint [dir]', true)
  .version('0.0.1')
  .action((dir) => {
    publint({ pkgDir: dir ? path.resolve(dir) : process.cwd() })
  })
  .parse(process.argv)
