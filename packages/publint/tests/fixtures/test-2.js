export default {
  'package.json': JSON.stringify({
    name: 'publint-test-2',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    main: './main.mjs',
    browser: './lib/bar.js',
    typings: "./doesn't-exist.d.ts",
    exports: {
      './*.js': './lib/*.js',
      './internal.js': null,
      './internal-dir/*': null,
      './browser': {
        browser: './lib/foo.js',
      },
      './module': {
        module: './lib/cjs.js',
      },
      './types/': {
        default: './types/',
      },
      './types/*': {
        types: './types/*.d.ts',
        default: './types/*.js',
      },
      './types/internal.d.ts': null,
      './foo': 'lib/cjs.js',
      './types/object': {
        types: {
          import: './types/a.d.ts',
          default: './types/internal.d.ts',
        },
      },
    },
  }),
  lib: {
    nested: {
      'baz.js': "export const baz = 'baz'",
    },
    'bar.js': `
      const bar = 'bar'
      console.log(bar)
    `,
    'cjs.js': "module.exports = 'foo'",
    'foo.js': "export const foo = 'foo'",
    'publish-excluded.js': '',
    'internal.js': "export const internal = 'internal'",
    'internal-dir': {
      'index.js': "export const internalDir = 'internalDir'",
    },
  },
  types: {
    'dual-extension': {
      'index.js': "export const foo = 'bar'",
      'index.mjs': "export const foo = 'bar'",
    },
    'a.d.ts': '',
    'a.js': '',
    'internal.d.ts': '',
  },
  '.npmignore': 'lib/publish-excluded.js',
  'main.mjs': "export const foo = 'bar'",
}
