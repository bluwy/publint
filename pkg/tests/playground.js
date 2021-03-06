import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { publint } from '../lib/node.js'

testFixture('glob', [])

testFixture('glob-deprecated', [
  'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING',
  'EXPORTS_GLOB_NO_MATCHED_FILES'
])

testFixture('test-1', ['FILE_INVALID_FORMAT'])

testFixture('test-2', ['FILE_INVALID_FORMAT', 'FILE_INVALID_FORMAT'])

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
