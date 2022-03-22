#!/usr/bin/env node

import path from 'path'
import sade from 'sade'
import { puba } from './node.js'

// TODO: Handcraft this
sade('puba [dir]', true)
  .version('0.0.1')
  .action((dir) => {
    puba({ pkgDir: dir ? path.resolve(dir) : process.cwd() })
  })
  .parse(process.argv)
