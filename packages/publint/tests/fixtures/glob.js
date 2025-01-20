export default {
  'package.json': JSON.stringify({
    name: 'publint-glob',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
  }),
  'dual-extension': {
    'index.js': "export const foo = 'bar'",
    'index.mjs': "export const foo = 'bar'",
  },
  quebec: {
    'romeo.css': '',
    'sierra.cjs': '',
  },
  'alpha.js': '',
  'bravo.mjs': '',
  'charlie.css': '',
  'delta.json': '',
}
