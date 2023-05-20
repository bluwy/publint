import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import { publint } from '../lib/node.js'
import { printMessage } from '../lib/utils-node.js'

testFixture('glob', [])

testFixture('glob-deprecated', [
  'EXPORTS_GLOB_NO_DEPRECATED_SUBPATH_MAPPING',
  'EXPORTS_GLOB_NO_MATCHED_FILES'
])

testFixture('missing-files', [
  'USE_EXPORTS_BROWSER',
  ...Array(7).fill('FILE_DOES_NOT_EXIST'),
  'FILE_NOT_PUBLISHED'
])

testFixture('no-exports-module', [])

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

testFixture('types', ['TYPES_NOT_EXPORTED'])

/**
 *
 * @param {string} name
 * @param {import('../index').Message['code'][]} expectCodes
 * @param {import('../index').Options['level']} [level]
 */
function testFixture(name, expectCodes, level, debug = false) {
  test(name, async () => {
    const pkgDir = path.resolve(process.cwd(), 'tests/fixtures', name)
    const messages = await publint({ pkgDir, level })

    if (debug) {
      const pkg = JSON.parse(
        await fs.readFile(path.join(pkgDir, 'package.json'), 'utf-8')
      )
      console.log()
      console.log('Logs:', name)
      messages.forEach((m) => console.log(printMessage(m, pkg)))
      console.log()
    }

    const codes = messages.map((v) => v.code)
    equal(codes, expectCodes, codes.join(', '))
  })
}

test.run()
