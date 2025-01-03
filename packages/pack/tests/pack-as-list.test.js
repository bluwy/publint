import cp from 'node:child_process'
import util from 'node:util'
import { test } from 'vitest'
import {
  packAsListWithJson,
  packAsListWithPack
} from '../src/node/pack-as-list.js'
import { createFixture } from 'fs-fixture'
import { isBunInstalled, setupCorepackAndTestHooks } from './utils.js'

// For some very weird reason, package manager binaries with corepack do not work
// on Windows, except yarn. All `exec()` calls just hang. Gave up after 4 hours.
const isWindowsCI = process.platform === 'win32' && process.env.CI !== undefined
const exec = util.promisify(cp.exec)
const defaultPackageJsonData = {
  name: 'test-package',
  version: '1.0.0',
  private: true
}

await setupCorepackAndTestHooks()

/**
 * @param {import('fs-fixture').FsFixture} fixture
 * @param {string | undefined} fallbackPackageManager
 * @param {string} strategy
 * @param {import('vitest').ExpectStatic} expect
 */
async function packlistWithFixture(
  fixture,
  fallbackPackageManager,
  strategy,
  expect
) {
  const pkgJson = await fixture.readFile('package.json', 'utf8')
  const packageManager = JSON.parse(pkgJson).packageManager

  try {
    if (packageManager) {
      const [name, version] = packageManager.split('@')
      // Should be using corepack with the correct version. Double check here.
      const { stdout } = await exec(`${name} --version`, { cwd: fixture.path })
      expect(stdout.trim()).toEqual(version)
    }

    const packAsList =
      strategy === 'json' ? packAsListWithJson : packAsListWithPack
    const pm = packageManager?.split('@')[0] ?? fallbackPackageManager ?? 'npm'

    return await packAsList(fixture.path, pm)
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
  'pnpm@9.15.1',
  'bun'
]) {
  if (
    pm === 'bun' &&
    process.env.CI === undefined &&
    !(await isBunInstalled())
  ) {
    console.info('Skipping bun tests because bun is not installed.')
    continue
  }

  const packageManagerValue =
    pm === 'empty' || pm === 'bun' ? {} : { packageManager: pm }

  for (const strategy of ['json', 'pack']) {
    if (strategy === 'json' && (pm === 'pnpm@8.15.9' || pm === 'bun')) {
      // Skip this test because `pack --json` is not supported in pnpm v8
      continue
    }

    // Other package manager can be detected via `package.json` `packageManager` field
    const fallbackPackageManager = pm === 'bun' ? 'bun' : undefined
    /** @type {import('vitest').TestOptions} */
    const testOpts = { concurrent: true, timeout: process.env.CI ? 8000 : 5000 }

    // prettier-ignore
    test.skipIf(isWindowsCI)(`packlist - ${pm} / ${strategy} / no-files`, testOpts, async ({ expect }) => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue
        }),
        'a.js': ''
      })

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, expect)
      expect(list.sort()).toEqual(['a.js', 'package.json'])
    })

    // prettier-ignore
    test.skipIf(isWindowsCI)(`packlist - ${pm} / ${strategy} / with-files`, testOpts, async ({ expect }) => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          files: ['a.js']
        }),
        'a.js': '',
        'b.js': ''
      })

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, expect)
      expect(list.sort()).toEqual(['a.js', 'package.json'])
    })

    // prettier-ignore
    test.skipIf(isWindowsCI)(`packlist - ${pm} / ${strategy} / with-files-and-glob`, testOpts, async ({ expect }) => {
      // Bun packs this wrongly
      if (pm === 'bun') return

      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          files: ['dir', '!dir/b.js']
        }),
        'dir/a.js': '',
        'dir/b.js': ''
      })

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, expect)
      expect(list.sort()).toEqual(['dir/a.js', 'package.json'])
    })
  }
}
