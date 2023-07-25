import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { publint } from '../lib/node.js'
import { printMessage } from '../lib/utils-node.js'

testFixture('exports-styles', [
  'EXPORTS_VALUE_INVALID',
  'FILE_DOES_NOT_EXIST',
  'FILE_DOES_NOT_EXIST',
  'FILE_INVALID_FORMAT',
  'FILE_INVALID_FORMAT'
])

testFixture('glob', [])

testFixture('glob-deprecated', [
  'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING',
  'EXPORTS_GLOB_NO_MATCHED_FILES'
])

testFixture('missing-files', [
  'USE_EXPORTS_BROWSER',
  ...Array(7).fill('FILE_DOES_NOT_EXIST'),
  'FILE_NOT_PUBLISHED',
  'EXPORT_TYPES_INVALID_FORMAT'
])

testFixture('no-exports-module', [])

testFixture('exports-module', ['EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE'])

testFixture('publish-config', ['USE_EXPORTS_BROWSER', 'FILE_DOES_NOT_EXIST'])

testFixture('test-1', ['TYPES_NOT_EXPORTED', 'FILE_INVALID_FORMAT'])

testFixture('test-2', [
  'USE_EXPORTS_BROWSER',
  'EXPORTS_VALUE_INVALID',
  'EXPORTS_MODULE_SHOULD_BE_ESM',
  'FILE_INVALID_FORMAT',
  'FILE_INVALID_FORMAT'
])

testFixture(
  'test-2 (level: warning)',
  [
    'EXPORTS_VALUE_INVALID',
    'EXPORTS_MODULE_SHOULD_BE_ESM',
    'FILE_INVALID_FORMAT',
    'FILE_INVALID_FORMAT'
  ],
  { level: 'warning' }
)

testFixture(
  'test-2 (level: error)',
  ['EXPORTS_VALUE_INVALID', 'EXPORTS_MODULE_SHOULD_BE_ESM'],
  { level: 'error' }
)

testFixture(
  'test-2 (strict: true)',
  [
    'EXPORTS_VALUE_INVALID',
    'EXPORTS_MODULE_SHOULD_BE_ESM',
    'FILE_INVALID_FORMAT',
    'FILE_INVALID_FORMAT'
  ],
  { level: 'error', strict: true }
)

testFixture(
  'test-2 (strict: true)',
  [
    { code: 'USE_EXPORTS_BROWSER', type: 'suggestion' },
    { code: 'EXPORTS_VALUE_INVALID', type: 'error' },
    { code: 'EXPORTS_MODULE_SHOULD_BE_ESM', type: 'error' },
    { code: 'FILE_INVALID_FORMAT', type: 'error' },
    { code: 'FILE_INVALID_FORMAT', type: 'error' }
  ],
  { strict: true }
)

testFixture('types', ['TYPES_NOT_EXPORTED'])

testFixture('types-exports-resolution', [])

testFixture('types-exports-resolution-dual', [
  'TYPES_NOT_EXPORTED',
  'TYPES_NOT_EXPORTED'
])

testFixture('types-exports-resolution-dual-explicit', [
  'EXPORT_TYPES_INVALID_FORMAT'
])

testFixture('types-versions', [])

/**
 * @typedef {{
 *  level?: import('../index.d.ts').Options['level']
 *  strict?: import('../index.d.ts').Options['strict']
 *  debug?: boolean
 * }} TestOptions
 */

/**
 * @param {string} name
 * @param {import('../index.d.ts').Message['code'][] | Pick<import('../index.d.ts').Message, 'code' | 'type'>[]} expectCodes
 * @param {TestOptions} [options]
 */
function testFixture(name, expectCodes, options) {
  test(name, async () => {
    const fixtureName = name.replace(/\(.*$/, '').trim()
    const pkgDir = path.resolve(process.cwd(), 'tests/fixtures', fixtureName)
    const messages = await publint({
      pkgDir,
      level: options?.level,
      strict: options?.strict
    })

    if (options?.debug) {
      const pkg = JSON.parse(
        await fs.readFile(path.join(pkgDir, 'package.json'), 'utf-8')
      )
      console.log()
      console.log('Logs:', name)
      messages.forEach((m) => console.log(printMessage(m, pkg)))
      console.log()
    }

    // you can test an array of obe
    if (typeof expectCodes[0] === 'object') {
      const codes = messages.map((v) => ({ code: v.code, type: v.type }))
      equal(codes, expectCodes, codes.join(', '))
    } else {
      const codes = messages.map((v) => v.code)
      equal(codes, expectCodes, codes.join(', '))
    }
  })
}

test.run()
