import path from 'node:path'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
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

test('isFilePathLintable', () => {
  equal(isFilePathLintable('foo.js'), true)
  equal(isFilePathLintable('foo.mjs'), true)
  equal(isFilePathLintable('foo.cjs'), true)
  equal(isFilePathLintable('foo.test.js'), true)
  equal(isFilePathLintable('foo.ts'), false)
  equal(isFilePathLintable('foo.ts.js'), true)
  equal(isFilePathLintable('foo.js.ts'), false)
})

test('isFileContentLintable', () => {
  equal(isFileContentLintable(`console.log('foo')`), true)
  equal(isFileContentLintable(`//@flow\nfoo`), false)
  equal(isFileContentLintable(`// @flow\nfoo`), false)
  equal(isFileContentLintable(`// @flow strict\nfoo`), false)
  equal(isFileContentLintable(`'use strict';\n// @flow`), false)
  equal(isFileContentLintable(`/*@flow*/\nfoo`), false)
  equal(isFileContentLintable(`/* @flow */\nfoo`), false)
  equal(isFileContentLintable(`/* @flow strict */\nfoo`), false)
  equal(isFileContentLintable(`'use strict';\n/* @flow */`), false)
  equal(isFileContentLintable(`console.log('// @flow')`), true)
  equal(isFileContentLintable(`console.log('/* @flow */')`), true)
  equal(isFileContentLintable(`/** @flow */`), false)
  equal(
    isFileContentLintable(`
/**
 * @flow
 */`),
    false
  )
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

test('isGitUrl', () => {
  equal(isGitUrl('https://host.xz/path/to/repo.git/'), true)
  equal(isGitUrl('http://host.xz/path/to/repo.git/'), true)
  equal(isGitUrl('https://host.xz/path/to/repo.git'), true)
  equal(isGitUrl('https://subdomain.host.xz/path/to/repo.git'), true)
  equal(isGitUrl('https://192.168.0.1/path/to/repo.git'), true)
  equal(isGitUrl('https://192.168.0.1:1234/path/to/repo.git'), true)
  equal(isGitUrl('http://host.xz/path/to/repo.git'), true)
  equal(isGitUrl('git+https://host.xz/path/to/repo.git'), true)
  equal(isGitUrl('git+https://host.xz/path/to/repo'), true)
  equal(isGitUrl('https://host.xz/path/to/repo.git'), true)
  equal(isGitUrl('git+ssh://git@host.xz/path/to/repo.git'), true)
  equal(isGitUrl('git+ssh://git@host.xz/path/to/repo'), true)
  equal(isGitUrl('git+ssh://git@host.xz:1234/path/to/repo'), true)
  equal(isGitUrl('git+ssh://host.xz:1234/path/to/repo'), true)
  equal(isGitUrl('git://host.xz/path/to/repo.git'), true)
  equal(isGitUrl('git://host.xz/path/to/repo'), true)
  equal(isGitUrl('ssh://git@host.xz/user/project.git'), true)
  equal(isGitUrl('ssh://git@host.xz:user/project.git'), true)
  equal(isGitUrl('git+ssh://git@host.xz/user/project.git'), true)
  equal(isGitUrl('git+ssh://git@host.xz:user/project.git'), true)
  // NOTE: this technically works, but it's quite an edge case and technically not a URL,
  // so maybe better to skip this and encourage proper URL format instead
  // equal(isGitUrl('git@github.com:react-component/tooltip.git'), true)

  equal(isGitUrl('file://host.xz/path/to/repo'), false)
  equal(isGitUrl('/User/foo/bar'), false)
})

test('isDeprecatedGitHubGitUrl', () => {
  equal(isDeprecatedGitHubGitUrl('git://github.com/user/project.git'), true)
  equal(isDeprecatedGitHubGitUrl('https://github.com/user/project'), false)
})

test('isShorthandGitHubOrGitLabUrl', () => {
  const f = isShorthandGitHubOrGitLabUrl // shorten to please prettier
  equal(f('https://github.com/user/project'), true)
  equal(f('git+https://github.com/user/project'), true)
  equal(f('https://github.com/user/project.git'), true)
  equal(f('https://gitlab.com/user/project'), true)
  equal(f('git+https://gitlab.com/user/project'), true)
  equal(f('https://gitlab.com/user/project.git'), true)

  equal(f('https://bitbucket.com/user/project'), false)
  equal(f('https://example.com'), false)
})

test('isShortHandRepositoryUrl', () => {
  equal(isShorthandRepositoryUrl('user/project'), true)
  equal(isShorthandRepositoryUrl('github:user/project'), true)
  equal(isShorthandRepositoryUrl('gist:11081aaa281'), true)
  equal(isShorthandRepositoryUrl('bitbucket:user/project'), true)
  equal(isShorthandRepositoryUrl('gitlab:user/project'), true)

  equal(isShorthandRepositoryUrl('foobar'), false)
  equal(isShorthandRepositoryUrl('https://github.com/user/project'), false)
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
  equal(result, '', result)
})

test('exportsGlob', async () => {
  const r = (s) => path.resolve(process.cwd(), 'tests/fixtures/glob', s)
  const v = createNodeVfs()
  // prettier-ignore
  equal(await exportsGlob(r('./*.js'), v), [r('alpha.js'), r('dual-extension/index.js')])
  // prettier-ignore
  equal(await exportsGlob(r('./*.mjs'), v), [r('bravo.mjs'), r('dual-extension/index.mjs')])
  // prettier-ignore
  equal(await exportsGlob(r('./*.css'), v), [r('charlie.css'), r('quebec/romeo.css')])
  // prettier-ignore
  equal(await exportsGlob(r('./*.json'), v), [r('delta.json'), r('package.json')])
  equal(await exportsGlob(r('./*.cjs'), v), [r('quebec/sierra.cjs')])
  // prettier-ignore
  equal(await exportsGlob(r('./quebec/*'), v), [r('quebec/romeo.css'), r('quebec/sierra.cjs')])
  equal(await exportsGlob(r('./*lph*.js'), v), [r('alpha.js')])
  // prettier-ignore
  equal(await exportsGlob(r('./qu*b*c/si*rra.cjs'), v), [r('quebec/sierra.cjs')])
})

test('getAdjacentDtsPath', () => {
  equal(getAdjacentDtsPath('foo.js'), 'foo.d.ts')
  equal(getAdjacentDtsPath('foo.mjs'), 'foo.d.mts')
  equal(getAdjacentDtsPath('foo.cjs'), 'foo.d.cts')
  equal(getAdjacentDtsPath('foo.jsx'), 'foo.d.ts')
  equal(getAdjacentDtsPath('foo.test.js'), 'foo.test.d.ts')
  equal(getAdjacentDtsPath('path/foo.js'), 'path/foo.d.ts')
})

test.run()
