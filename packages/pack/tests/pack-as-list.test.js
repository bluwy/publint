import cp from 'node:child_process'
import util from 'node:util'
import { test } from 'vitest'
import {
  packAsListWithJson,
  packAsListWithPack
} from '../src/node/pack-as-list.js'
import { createFixture } from 'fs-fixture'
import { isBunInstalled, setupCorepackAndTestHooks } from './utils.js'

const isCI = process.env.CI !== undefined
// For some very weird reason, package manager binaries with corepack do not work
// on Windows, except yarn. All `exec()` calls just hang. Gave up after 4 hours.
const isWindowsCI = isCI && process.platform === 'win32'
const exec = util.promisify(cp.exec)
const defaultPackageJsonData = {
  name: 'test-package',
  version: '1.0.0',
  private: true
}

// NOTE: npm tests are only run in CI because corepack npm support can delete your
// local npm installation. https://github.com/nodejs/corepack/issues/112
const packageManagers = /** @type {string[]} */ (
  [
    'empty',
    isCI && 'npm@9.9.4',
    isCI && 'npm@10.7.0',
    isCI && 'npm@11.0.0',
    'yarn@3.8.7',
    'yarn@4.5.3',
    'pnpm@8.15.9',
    'pnpm@9.15.1',
    'bun'
  ].filter(Boolean)
)

await setupCorepackAndTestHooks()

/**
 * @param {import('fs-fixture').FsFixture} fixture
 * @param {string | undefined} fallbackPackageManager
 * @param {string} strategy
 * @param {boolean} ignoreScripts
 * @param {import('vitest').ExpectStatic} expect
 */
async function packlistWithFixture(
  fixture,
  fallbackPackageManager,
  strategy,
  ignoreScripts,
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

    return await packAsList(fixture.path, pm, ignoreScripts)
  } finally {
    await fixture.rm()
  }
}

// NOTE: only test recent package manager releases
for (const pm of packageManagers) {
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

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, false, expect)
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

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, false, expect)
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

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, false, expect)
      expect(list.sort()).toEqual(['dir/a.js', 'package.json'])
    })

    // prettier-ignore
    // skipping yarn as it does not support ignoring scripts
    test.skipIf(isWindowsCI || pm.startsWith('yarn'))(`packlist - ${pm} / ${strategy} / ignore-scripts-true`, testOpts, async ({ expect }) => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          scripts: {
            prepack: "node -e \"require('fs').writeFileSync('prepack.js', '')\""
          }
        }),
        'a.js': ''
      })

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, true, expect)
      // NOTE: for some reason the below `exists` check is always false, even if prepack script
      // is run. But the next expect should still verify that prepack.js is not packed.
      expect(await fixture.exists('prepack.js')).toBe(false)
      expect(list.sort()).toEqual(['a.js', 'package.json'])
    })

    // prettier-ignore
    // skipping yarn as it does not support ignoring scripts
    test.skipIf(isWindowsCI || pm.startsWith('yarn'))(`packlist - ${pm} / ${strategy} / ignore-scripts-false`, testOpts, async ({ expect }) => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          scripts: {
            prepack: "node -e \"require('fs').writeFileSync('prepack.js', '')\""
          }
        }),
        'a.js': ''
      })

      const list = await packlistWithFixture(fixture, fallbackPackageManager, strategy, false, expect)
      expect(list.sort()).toEqual(['a.js', 'package.json', 'prepack.js'])
    })
  }
}
