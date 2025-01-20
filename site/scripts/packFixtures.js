import cp from 'child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createFixture } from 'fs-fixture'

const fixtureDir = path.resolve('../packages/publint/tests/fixtures')
const fixtures = await fs.readdir(fixtureDir)

console.log('Create ./public/temp/ dir')

await fs.mkdir('./public/temp', { recursive: true })

console.log('Packing fixtures', fixtures)

await Promise.all(
  fixtures.map(async (fixtureName) => {
    const fixturePath = path.resolve(fixtureDir, fixtureName)
    const fixtureContent = (await import(fixturePath)).default
    const fixture = await createFixture(fixtureContent)

    const proc = cp.exec(
      `npm pack ${fixture.path} --pack-destination=./public/temp/`,
    )
    return new Promise((resolve, reject) => {
      proc.addListener('exit', () => resolve())
      proc.addListener('error', () => reject())
    }).finally(async () => {
      await fixture.rm()
    })
  }),
)

console.log('Done')
