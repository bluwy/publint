import cp from 'node:child_process'
import util from 'node:util'
import { test } from 'vitest'
import { packlist } from '../src/index.js'
import { createFixture } from 'fs-fixture'
import { isBunInstalled, setupCorepackAndTestHooks } from './utils.js'

const exec = util.promisify(cp.exec)
const defaultPackageJsonData = {
  name: 'test-package',
  version: '1.0.0',
  private: true
}

await setupCorepackAndTestHooks()

/**
 * @param {import('fs-fixture').FsFixture} fixture
 * @param {import('../index').Options} [opts]
 * @param {import('vitest').ExpectStatic} expect
 */
async function packlistWithFixture(fixture, opts, expect) {
  const pkgJson = await fixture.readFile('package.json', 'utf8')
  const packageManager = JSON.parse(pkgJson).packageManager

  try {
    console.log('pm', packageManager)
    if (packageManager) {
      const [name, version] = packageManager.split('@')
      // Should be using corepack with the correct version. Double check here.
      const { stdout } = await exec(`${name} --version`, { cwd: fixture.path })
      console.log('pmv', packageManager, stdout)
      expect(stdout.trim()).toEqual(version)
    }
    console.log('packing right now')

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
  'npm@9.9.4'
  // 'npm@10.7.0',
  // 'npm@11.0.0',
  // 'yarn@3.8.7',
  // 'yarn@4.5.3',
  // 'pnpm@8.15.9',
  // 'pnpm@9.15.1',
  // 'bun'
]) {
  if (
    pm === 'bun' &&
    process.env.CI == undefined &&
    !(await isBunInstalled())
  ) {
    console.info('Skipping bun tests because bun is not installed.')
    continue
  }

  const packageManagerValue =
    pm === 'empty' || pm === 'bun' ? {} : { packageManager: pm }

  for (const strategy of [
    'json'
    // 'pack',
    // 'json-and-pack'
  ]) {
    if (strategy === 'json' && (pm === 'pnpm@8.15.9' || pm === 'bun')) {
      // Skip this test because `pack --json` is not supported in pnpm v8
      continue
    }

    /** @type {import('../index.d.ts').Options} */
    const packlistOpts = { strategy }
    if (pm === 'bun') packlistOpts.packageManager = 'bun'

    // prettier-ignore
    test(`packlist - ${pm} / ${strategy} / no-files`, { concurrent: false }, async ({ expect }) => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue
        }),
        'a.js': ''
      })

      console.log('packing')
      const list = await packlistWithFixture(fixture, packlistOpts, expect)
      console.log('packing done')
      expect(list.sort()).toEqual(['a.js', 'package.json'])
    })

    // prettier-ignore
    test(`packlist - ${pm} / ${strategy} / with-files`, { concurrent: true }, async ({ expect }) => {
      const fixture = await createFixture({
        'package.json': JSON.stringify({
          ...defaultPackageJsonData,
          ...packageManagerValue,
          files: ['a.js']
        }),
        'a.js': '',
        'b.js': ''
      })

      const list = await packlistWithFixture(fixture, packlistOpts, expect)
      expect(list.sort()).toEqual(['a.js', 'package.json'])
    })

    // prettier-ignore
    test(`packlist - ${pm} / ${strategy} / with-files-and-glob`, { concurrent: true }, async ({ expect }) => {
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

      const list = await packlistWithFixture(fixture, packlistOpts, expect)
      expect(list.sort()).toEqual(['dir/a.js', 'package.json'])
    })
  }
}