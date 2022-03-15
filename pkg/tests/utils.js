import path from 'path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
import {
  exportsGlob,
  isCodeCjs,
  isCodeEsm,
  isCodeMatchingFormat
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
    equal(isCodeCjs(code), true)
  }
  for (const code of esmCode) {
    equal(isCodeCjs(code), false)
  }
  for (const code of isoCode) {
    equal(isCodeCjs(code), false)
  }
})

test('isCodeCjs', () => {
  for (const code of cjsCode) {
    equal(isCodeEsm(code), false)
  }
  for (const code of esmCode) {
    equal(isCodeEsm(code), true)
  }
  for (const code of isoCode) {
    equal(isCodeEsm(code), false)
  }
})

test('isCodeMatchingFormat', () => {
  for (const code of cjsCode) {
    equal(isCodeMatchingFormat(code, 'cjs'), true)
  }
  for (const code of esmCode) {
    equal(isCodeMatchingFormat(code, 'esm'), true)
  }
  for (const code of isoCode) {
    equal(isCodeMatchingFormat(code, 'esm'), true)
    equal(isCodeMatchingFormat(code, 'cjs'), true)
  }
})

test('exportsGlob', async () => {
  const r = (s) => path.resolve(process.cwd(), 'playground/glob', s)
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
