import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import {
  exportsGlob,
  getCodeFormat,
  isCodeCjs,
  isCodeEsm
} from '../src/utils.js'
import { createNodeVfs } from '../src/vfs.js'

const cjsCode = [
  `require('bla')`,
  `function foo() { require('bla') }`,
  `module.exports = 'bla'`,
  `exports.foo = 'bla'`,
  `exports.default = 'bla'`,
  `Object.defineProperty(exports, 'foo', { value: 'bla' })`,
  `Object.defineProperties(exports, { foo: { value: 'bla' } })`,
  `Object.assign(exports, { foo: 'bla' })`
]

const esmCode = [
  `import 'bla'`,
  `import foo from 'bla'`,
  `import { foo } from 'bla'`,
  `import { foo as bar } from 'bla'`,
  `function foo() { import('bla') }`,
  'export default "bla"',
  'export const foo = "bla"',
  'export function foo() { return "bla" }'
]

const isoCode = [`console.log('hello')`, `document.title = 'bla`]

test('isCodeCjs', () => {
  for (const code of cjsCode) {
    equal(isCodeCjs(code), true, code)
  }
  for (const code of esmCode) {
    equal(isCodeCjs(code), false, code)
  }
  for (const code of isoCode) {
    equal(isCodeCjs(code), false, code)
  }
})

test('isCodeCjs', () => {
  for (const code of cjsCode) {
    equal(isCodeEsm(code), false, code)
  }
  for (const code of esmCode) {
    equal(isCodeEsm(code), true, code)
  }
  for (const code of isoCode) {
    equal(isCodeEsm(code), false, code)
  }
})

test('getCodeFormat', () => {
  for (const code of cjsCode) {
    equal(getCodeFormat(code), 'CJS', code)
  }
  for (const code of esmCode) {
    equal(getCodeFormat(code), 'ESM', code)
  }
  for (const code of isoCode) {
    equal(getCodeFormat(code), 'unknown', code)
  }
})

test('exportsGlob', async () => {
  const r = (s) => path.resolve(process.cwd(), 'tests/fixtures/glob', s)
  const v = createNodeVfs()
  equal(await exportsGlob(r('./*.js'), v), [r('alpha.js')])
  equal(await exportsGlob(r('./*.mjs'), v), [r('bravo.mjs')])
  // prettier-ignore
  equal(await exportsGlob(r('./*.css'), v), [r('charlie.css'), r('quebec/romeo.css')])
  // prettier-ignore
  equal(await exportsGlob(r('./*.json'), v), [r('delta.json'), r('package.json')])
  equal(await exportsGlob(r('./*.cjs'), v), [r('quebec/sierra.cjs')])
  // prettier-ignore
  equal(await exportsGlob(r('./quebec/*'), v), [r('quebec/romeo.css'), r('quebec/sierra.cjs')])
})

test.run()
