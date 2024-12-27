import cp from 'node:child_process'
import util from 'node:util'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { packlist } from '../src/index.js'
import { createFixture } from 'fs-fixture'

const exec = util.promisify(cp.exec)
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
  const packageManager = JSON.parse(pkgJson).packageManager

  try {
    if (packageManager) {
      const [name, version] = packageManager.split('@')
      await exec(`corepack enable ${name}`, { cwd: fixture.path })
      const { stdout } = await exec(`${name} --version`, {
        cwd: fixture.path
      })
      equal(stdout.trim(), version)
    }

    return await packlist(fixture.path, {
      packageManager: packageManager?.split('@')[0],
      ...opts
    })
  } finally {
    await fixture.rm()
  }
}

// NOTE: only test recent package manager releases
for (const pm of [
  'empty',
  'npm@9.9.4',
  'npm@10.7.0',
  'npm@11.0.0',
  'yarn@3.8.7',
  'yarn@4.5.3',
  'pnpm@8.15.9',
  'pnpm@9.15.1'
]) {
  const packageManagerValue = pm === 'empty' ? {} : { packageManager: pm }

  for (const strategy of ['json', 'pack', 'json-and-pack']) {
    if (pm === 'pnpm@8.15.9' && strategy === 'json') {
      // Skip this test because `pnpm pack` is not supported in pnpm v8
      continue
    }

    const packlistOpts = { strategy }

    test(`packlist - ${pm} / ${strategy} / no-files`, async () => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue
        }),
        'a.js': ''
      })

      const list = await packlistWithFixture(fixture, packlistOpts)
      equal(list, ['a.js', 'package.json'])
    })

    test(`packlist - ${pm} / ${strategy} / with-files`, async () => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          files: ['a.js']
        }),
        'a.js': '',
        'b.js': ''
      })

      const list = await packlistWithFixture(fixture, packlistOpts)
      equal(list, ['a.js', 'package.json'])
    })

    test(`packlist - ${pm} / ${strategy} / with-files`, async () => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          files: ['a.js']
        }),
        'a.js': '',
        'b.js': ''
      })

      const list = await packlistWithFixture(fixture, packlistOpts)
      equal(list, ['a.js', 'package.json'])
    })

    test(`packlist - ${pm} / ${strategy} / with-files / glob`, async () => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          files: ['dir', '!dir/b.js']
        }),
        'dir/a.js': '',
        'dir/b.js': ''
      })

      const list = await packlistWithFixture(fixture, packlistOpts)
      equal(list, ['dir/a.js', 'package.json'])
    })
  }
}

test.run()
