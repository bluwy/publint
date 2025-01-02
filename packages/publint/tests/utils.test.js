import path from 'node:path'
import { test, expect } from 'vitest'
import {
  exportsGlob,
  getAdjacentDtsPath,
  getCodeFormat,
  isCodeCjs,
  isCodeEsm,
  isDeprecatedGitHubGitUrl,
  isFileContentLintable,
  isFilePathLintable,
  isGitUrl,
  isShorthandGitHubOrGitLabUrl,
  isShorthandRepositoryUrl,
  stripComments
} from '../src/shared/utils.js'
import { createNodeVfs } from '../src/node/vfs-node.js'

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
  'export default "bla"',
  'export const foo = "bla"',
  'export function foo() { return "bla" }'
]

const isoCode = [`console.log('hello')`, `document.title = 'bla`]

test('isCodeCjs', () => {
  for (const code of cjsCode) {
    expect(isCodeCjs(code), code).toEqual(true)
  }
  for (const code of esmCode) {
    expect(isCodeCjs(code), code).toEqual(false)
  }
  for (const code of isoCode) {
    expect(isCodeCjs(code), code).toEqual(false)
  }
})

test('isCodeCjs', () => {
  for (const code of cjsCode) {
    expect(isCodeEsm(code), code).toEqual(false)
  }
  for (const code of esmCode) {
    expect(isCodeEsm(code), code).toEqual(true)
  }
  for (const code of isoCode) {
    expect(isCodeEsm(code), code).toEqual(false)
  }
})

test('isFilePathLintable', () => {
  expect(isFilePathLintable('foo.js')).toEqual(true)
  expect(isFilePathLintable('foo.mjs')).toEqual(true)
  expect(isFilePathLintable('foo.cjs')).toEqual(true)
  expect(isFilePathLintable('foo.test.js')).toEqual(true)
  expect(isFilePathLintable('foo.ts')).toEqual(false)
  expect(isFilePathLintable('foo.ts.js')).toEqual(true)
  expect(isFilePathLintable('foo.js.ts')).toEqual(false)
})

test('isFileContentLintable', () => {
  expect(isFileContentLintable(`console.log('foo')`)).toEqual(true)
  expect(isFileContentLintable(`//@flow\nfoo`)).toEqual(false)
  expect(isFileContentLintable(`// @flow\nfoo`)).toEqual(false)
  expect(isFileContentLintable(`// @flow strict\nfoo`)).toEqual(false)
  expect(isFileContentLintable(`'use strict';\n// @flow`)).toEqual(false)
  expect(isFileContentLintable(`/*@flow*/\nfoo`)).toEqual(false)
  expect(isFileContentLintable(`/* @flow */\nfoo`)).toEqual(false)
  expect(isFileContentLintable(`/* @flow strict */\nfoo`)).toEqual(false)
  expect(isFileContentLintable(`'use strict';\n/* @flow */`)).toEqual(false)
  expect(isFileContentLintable(`console.log('// @flow')`)).toEqual(true)
  expect(isFileContentLintable(`console.log('/* @flow */')`)).toEqual(true)
  expect(isFileContentLintable(`/** @flow */`)).toEqual(false)
  expect(
    isFileContentLintable(`
/**
 * @flow
 */`)
  ).toEqual(false)
})

test('getCodeFormat', () => {
  for (const code of cjsCode) {
    expect(getCodeFormat(code), code).toEqual('CJS')
  }
  for (const code of esmCode) {
    expect(getCodeFormat(code), code).toEqual('ESM')
  }
  for (const code of isoCode) {
    expect(getCodeFormat(code), code).toEqual('unknown')
  }
})

test('isGitUrl', () => {
  expect(isGitUrl('https://host.xz/path/to/repo.git/')).toEqual(true)
  expect(isGitUrl('http://host.xz/path/to/repo.git/')).toEqual(true)
  expect(isGitUrl('https://host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('https://subdomain.host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('https://192.168.0.1/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('https://192.168.0.1:1234/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('http://host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('git+https://host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('git+https://host.xz/path/to/repo')).toEqual(true)
  expect(isGitUrl('https://host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('git+ssh://git@host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('git+ssh://git@host.xz/path/to/repo')).toEqual(true)
  expect(isGitUrl('git+ssh://git@host.xz:1234/path/to/repo')).toEqual(true)
  expect(isGitUrl('git+ssh://host.xz:1234/path/to/repo')).toEqual(true)
  expect(isGitUrl('git://host.xz/path/to/repo.git')).toEqual(true)
  expect(isGitUrl('git://host.xz/path/to/repo')).toEqual(true)
  expect(isGitUrl('ssh://git@host.xz/user/project.git')).toEqual(true)
  expect(isGitUrl('ssh://git@host.xz:user/project.git')).toEqual(true)
  expect(isGitUrl('git+ssh://git@host.xz/user/project.git')).toEqual(true)
  expect(isGitUrl('git+ssh://git@host.xz:user/project.git')).toEqual(true)
  // NOTE: this technically works, but it's quite an edge case and technically not a URL,
  // so maybe better to skip this and encourage proper URL format instead
  // assert.equal(isGitUrl('git@github.com:react-component/tooltip.git'), true)

  expect(isGitUrl('file://host.xz/path/to/repo')).toEqual(false)
  expect(isGitUrl('/User/foo/bar')).toEqual(false)
})

test('isDeprecatedGitHubGitUrl', () => {
  expect(isDeprecatedGitHubGitUrl('git://github.com/user/project.git')).toEqual(
    true
  )
  expect(isDeprecatedGitHubGitUrl('https://github.com/user/project')).toEqual(
    false
  )
})

test('isShorthandGitHubOrGitLabUrl', () => {
  const f = isShorthandGitHubOrGitLabUrl // shorten to please prettier
  expect(f('https://github.com/user/project')).toEqual(true)
  expect(f('git+https://github.com/user/project')).toEqual(true)
  expect(f('https://github.com/user/project.git')).toEqual(true)
  expect(f('https://gitlab.com/user/project')).toEqual(true)
  expect(f('git+https://gitlab.com/user/project')).toEqual(true)
  expect(f('https://gitlab.com/user/project.git')).toEqual(true)

  expect(f('https://bitbucket.com/user/project')).toEqual(false)
  expect(f('https://example.com')).toEqual(false)
})

test('isShortHandRepositoryUrl', () => {
  expect(isShorthandRepositoryUrl('user/project')).toEqual(true)
  expect(isShorthandRepositoryUrl('github:user/project')).toEqual(true)
  expect(isShorthandRepositoryUrl('gist:11081aaa281')).toEqual(true)
  expect(isShorthandRepositoryUrl('bitbucket:user/project')).toEqual(true)
  expect(isShorthandRepositoryUrl('gitlab:user/project')).toEqual(true)

  expect(isShorthandRepositoryUrl('foobar')).toEqual(false)
  expect(isShorthandRepositoryUrl('https://github.com/user/project')).toEqual(
    false
  )
})

test('stripComments', () => {
  const result = stripComments(`
  // hello world
  /*
    mutli
        line
    // import {} from 'bla'
  */
 /**
  * jsdoc // comment
  */
  `).trim()
  expect(result).toEqual('')
})

test('exportsGlob', async () => {
  const r = (/** @type {string} */ s) =>
    path.resolve(process.cwd(), 'tests/fixtures/glob', s)
  const v = createNodeVfs()
  // prettier-ignore
  expect(await exportsGlob(r('./*.js'), v)).toEqual([r('alpha.js'), r('dual-extension/index.js')])
  // prettier-ignore
  expect(await exportsGlob(r('./*.mjs'), v)).toEqual([r('bravo.mjs'), r('dual-extension/index.mjs')])
  // prettier-ignore
  expect(await exportsGlob(r('./*.css'), v)).toEqual([r('charlie.css'), r('quebec/romeo.css')])
  // prettier-ignore
  expect(await exportsGlob(r('./*.json'), v)).toEqual([r('delta.json'), r('package.json')])
  expect(await exportsGlob(r('./*.cjs'), v)).toEqual([r('quebec/sierra.cjs')])
  // prettier-ignore
  expect(await exportsGlob(r('./quebec/*'), v)).toEqual([r('quebec/romeo.css'), r('quebec/sierra.cjs')])
  expect(await exportsGlob(r('./*lph*.js'), v)).toEqual([r('alpha.js')])
  // prettier-ignore
  expect(await exportsGlob(r('./qu*b*c/si*rra.cjs'), v)).toEqual([r('quebec/sierra.cjs')])
})

test('getAdjacentDtsPath', () => {
  expect(getAdjacentDtsPath('foo.js')).toEqual('foo.d.ts')
  expect(getAdjacentDtsPath('foo.mjs')).toEqual('foo.d.mts')
  expect(getAdjacentDtsPath('foo.cjs')).toEqual('foo.d.cts')
  expect(getAdjacentDtsPath('foo.jsx')).toEqual('foo.d.ts')
  expect(getAdjacentDtsPath('foo.test.js')).toEqual('foo.test.d.ts')
  expect(getAdjacentDtsPath('path/foo.js')).toEqual('path/foo.d.ts')
})
