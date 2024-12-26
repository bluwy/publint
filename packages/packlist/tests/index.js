import cp from 'node:child_process'
import util from 'node:util'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { packlist } from '../src/index.js'
import { createFixture } from 'fs-fixture'

const defaultPackageJsonData = {
  name: 'test-package',
  version: '1.0.0',
  private: true
}

/**
 * @param {import('fs-fixture').FsFixture} fixture
 * @param {import('../index.d.ts').Options} [opts]
 */
async function packlistWithFixture(fixture, opts) {
  const pkgJson = await fixture.readFile('package.json', 'utf8')
  const packageManager = JSON.parse(pkgJson).packageManager?.split('@')[0]

  try {
    if (packageManager) {
      await util.promisify(cp.exec)('corepack enable', { cwd: fixture.path })
    }

    return await packlist(fixture.path, {
      packageManager,
      ...opts
    })
  } finally {
    await fixture.rm()
  }
}

for (const pm of [
  'empty',
  'npm@10.7.0',
  'yarn@1.22.22',
  'yarn@4.5.3',
  'pnpm@9.15.1'
]) {
  test(`packlist - ${pm} / no-files`, async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify(defaultPackageJsonData),
      'a.js': ''
    })

    const list = await packlistWithFixture(fixture)
    equal(list, ['a.js', 'package.json'])
  })

  test(`packlist - ${pm} / with-files`, async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({
        ...defaultPackageJsonData,
        files: ['a.js']
      }),
      'a.js': '',
      'b.js': ''
    })

    const list = await packlistWithFixture(fixture)
    equal(list, ['a.js', 'package.json'])
  })

  test(`packlist - ${pm} / with-files`, async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({
        ...defaultPackageJsonData,
        files: ['a.js']
      }),
      'a.js': '',
      'b.js': ''
    })

    const list = await packlistWithFixture(fixture)
    equal(list, ['a.js', 'package.json'])
  })

  test(`packlist - ${pm} / with-files / glob`, async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({
        ...defaultPackageJsonData,
        files: ['dir', '!dir/b.js']
      }),
      'dir/a.js': '',
      'dir/b.js': ''
    })

    const list = await packlistWithFixture(fixture)
    equal(list, ['dir/a.js', 'package.json'])
  })
}

test.run()
