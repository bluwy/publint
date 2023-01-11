import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { publint } from '../lib/node.js'

testFixture('glob', [])

testFixture('glob-deprecated', [
  'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING',
  'EXPORTS_GLOB_NO_MATCHED_FILES'
])

testFixture('missing-files', [
  'USE_EXPORTS_BROWSER',
  ...Array(7).fill('FILE_DOES_NOT_EXIST')
])

testFixture('test-1', ['FILE_INVALID_FORMAT'])

testFixture('test-2', [
  'USE_EXPORTS_BROWSER',
  'EXPORTS_VALUE_INVALID',
  'EXPORTS_MODULE_SHOULD_BE_ESM',
  'FILE_INVALID_FORMAT',
  'FILE_INVALID_FORMAT'
])

testFixture(
  'test-2',
  [
    'EXPORTS_VALUE_INVALID',
    'EXPORTS_MODULE_SHOULD_BE_ESM',
    'FILE_INVALID_FORMAT',
    'FILE_INVALID_FORMAT'
  ],
  'warning'
)

testFixture(
  'test-2',
  ['EXPORTS_VALUE_INVALID', 'EXPORTS_MODULE_SHOULD_BE_ESM'],
  'error'
)

/**
 *
 * @param {string} name
 * @param {import('../lib/index').Message['code'][]} expectCodes
 * @param {import('../lib/index').Options['level']} [level]
 */
function testFixture(name, expectCodes, level) {
  test(name, async () => {
    const messages = await publint({
      pkgDir: path.resolve(process.cwd(), 'tests/fixtures', name),
      level
    })
    const codes = messages.map((v) => v.code)
    equal(codes, expectCodes, codes.join(', '))
  })
}

test.run()
