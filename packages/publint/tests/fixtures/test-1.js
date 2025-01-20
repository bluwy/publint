export default {
  'package.json': JSON.stringify({
    name: 'publint-test-1',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    exports: './main.js',
    dependencies: {
      '@test/file-reference': 'file:../test-2',
      '@test/link-reference': 'file:../test-2',
    },
  }),
  tests: {
    'test.js': '// suggest pkg.files if this file is published',
  },
  'index.d.ts': 'export const foo: string',
  'main.js': "export const foo = 'This file is ESM, but extension says CJS'",
}
