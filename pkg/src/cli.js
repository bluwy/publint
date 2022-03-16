#!/usr/bin/env node

import path from 'path'
import sade from 'sade'
import { puba } from './index.js'
import { createNodeVfs } from './vfs.js'

// TODO: Handcraft this
sade('puba [dir]', true)
  .version('0.0.1')
  .action((dir) => {
    puba({
      dir: dir ? path.resolve(dir) : process.cwd(),
      vfs: createNodeVfs
    })
  })
  .parse(process.argv)
