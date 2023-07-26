import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { publint } from '../lib/node.js'
import { formatMessage } from '../lib/utils-node.js'

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
  'EXPORT_TYPES_INVALID_FORMAT',
  ...Array(7).fill('FILE_DOES_NOT_EXIST'),
  'FILE_NOT_PUBLISHED',
  'USE_EXPORTS_BROWSER'
])

testFixture('no-exports-module', [])

testFixture('exports-module', ['EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE'])

testFixture('publish-config', ['FILE_DOES_NOT_EXIST', 'USE_EXPORTS_BROWSER'])

testFixture('test-1', ['FILE_INVALID_FORMAT', 'TYPES_NOT_EXPORTED'])

testFixture('test-2', [
  'EXPORTS_MODULE_SHOULD_BE_ESM',
  'EXPORTS_VALUE_INVALID',
  'FILE_INVALID_FORMAT',
  'FILE_INVALID_FORMAT',
  'USE_EXPORTS_BROWSER'
])

testFixture(
  'test-2 (level: warning)',
  [
    'EXPORTS_MODULE_SHOULD_BE_ESM',
    'EXPORTS_VALUE_INVALID',
    'FILE_INVALID_FORMAT',
    'FILE_INVALID_FORMAT'
  ],
  { level: 'warning' }
)

testFixture(
  'test-2 (level: error)',
  ['EXPORTS_MODULE_SHOULD_BE_ESM', 'EXPORTS_VALUE_INVALID'],
  { level: 'error' }
)

testFixture(
  'test-2 (strict: true)',
  [
    'EXPORTS_MODULE_SHOULD_BE_ESM',
    'EXPORTS_VALUE_INVALID',
    'FILE_INVALID_FORMAT',
    'FILE_INVALID_FORMAT'
  ],
  { level: 'error', strict: true }
)

testFixture(
  'test-2 (strict: true)',
  [
    { code: 'EXPORTS_MODULE_SHOULD_BE_ESM', type: 'error' },
    { code: 'EXPORTS_VALUE_INVALID', type: 'error' },
    { code: 'FILE_INVALID_FORMAT', type: 'error' },
    { code: 'FILE_INVALID_FORMAT', type: 'error' },
    { code: 'USE_EXPORTS_BROWSER', type: 'suggestion' }
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
    const { messages } = await publint({
      pkgDir,
      level: options?.level,
      strict: options?.strict
    })

    // unfortunately the messages are not always in order as checks are ran in parallel,
    // here we sort it to make the tests more consistent
    messages.sort((a, b) => a.code.localeCompare(b.code))

    if (options?.debug) {
      const pkg = JSON.parse(
        await fs.readFile(path.join(pkgDir, 'package.json'), 'utf-8')
      )
      console.log()
      console.log('Logs:', name)
      messages.forEach((m) => console.log(formatMessage(m, pkg)))
      console.log()
    }

    // you can test an array of objects
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
