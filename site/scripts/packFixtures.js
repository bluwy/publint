import cp from 'child_process'
import fs from 'fs/promises'
import path from 'path'

const fixtures = ['glob', 'test-1', 'test-2']

console.log('Create ./public/temp/ dir')

await fs.mkdir('./public/temp')

console.log('Packing fixtures', fixtures)

await Promise.all(
  fixtures.map((fixture) => {
    const fixturePath = path.resolve('../pkg/tests/fixtures', fixture)
    const proc = cp.exec(
      `npm pack ${fixturePath} --pack-destination=./public/temp/`
    )
    return new Promise((resolve, reject) => {
      proc.addListener('exit', () => resolve())
      proc.addListener('error', () => reject())
    })
  })
)

console.log('Done')
