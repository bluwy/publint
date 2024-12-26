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
  try {
    return await packlist(fixture.path, opts)
  } finally {
    await fixture.rm()
  }
}

for (const pm of [
  'auto-npm-empty',
  'auto-npm',
  'auto-yarn',
  'auto-pnpm',
  'npm',
  'yarn',
  'pnpm'
]) {
  const pmFiles = pm.includes('-empty')
    ? {}
    : pm.includes('-npm')
      ? { 'package-lock.json': '' }
      : pm.includes('-yarn')
        ? { 'yarn.lock': '' }
        : pm.includes('-pnpm')
          ? { 'pnpm-lock.yaml': '' }
          : {}
  const pmOpts = pm.includes('auto-')
    ? {}
    : pm.includes('npm')
      ? { packageManager: 'npm' }
      : pm.includes('yarn')
        ? { packageManager: 'yarn' }
        : pm.includes('pnpm')
          ? { packageManager: 'pnpm' }
          : {}

  test(`packlist - ${pm} / no-files`, async () => {
    const fixture = await createFixture({
      ...pmFiles,
      'package.json': JSON.stringify(defaultPackageJsonData),
      'a.js': ''
    })

    const list = await packlistWithFixture(fixture, pmOpts)
    equal(list, ['a.js', 'package.json'])
  })

  test(`packlist - ${pm} / with-files`, async () => {
    const fixture = await createFixture({
      ...pmFiles,
      'package.json': JSON.stringify({
        ...defaultPackageJsonData,
        files: ['a.js']
      }),
      'a.js': '',
      'b.js': ''
    })

    const list = await packlistWithFixture(fixture, pmOpts)
    equal(list, ['a.js', 'package.json'])
  })

  test(`packlist - ${pm} / with-files`, async () => {
    const fixture = await createFixture({
      ...pmFiles,
      'package.json': JSON.stringify({
        ...defaultPackageJsonData,
        files: ['a.js']
      }),
      'a.js': '',
      'b.js': ''
    })

    const list = await packlistWithFixture(fixture, pmOpts)
    equal(list, ['a.js', 'package.json'])
  })

  test(`packlist - ${pm} / with-files / glob`, async () => {
    const fixture = await createFixture({
      ...pmFiles,
      'package.json': JSON.stringify({
        ...defaultPackageJsonData,
        files: ['dir', '!dir/b.js']
      }),
      'dir/a.js': '',
      'dir/b.js': ''
    })

    const list = await packlistWithFixture(fixture, pmOpts)
    equal(list, ['dir/a.js', 'package.json'])
  })
}

test.run()
