export default {
  'package.json': JSON.stringify({
    name: 'publint-npmignore',
    version: '0.0.1',
    private: true,
    type: 'module',
    exports: './main.js',
  }),
  tests: {
    'test.js': '// suggest pkg.files if this file is published',
  },
  '.npmignore': 'tests',
  'main.js': "export const foo = 'This file is ESM, but extension says CJS'",
}
