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
  'EXPORTS_MODULE_SHOULD_BE_ESM',
  'FILE_INVALID_FORMAT',
  'FILE_INVALID_FORMAT'
])

/**
 *
 * @param {string} name
 * @param {import('../lib/index').Message['code'][]} expectCodes
 */
function testFixture(name, expectCodes) {
  test(name, async () => {
    const messages = await publint({
      pkgDir: path.resolve(process.cwd(), 'tests/fixtures', name)
    })
    const codes = messages.map((v) => v.code)
    equal(codes, expectCodes, codes.join(', '))
  })
}

test.run()
