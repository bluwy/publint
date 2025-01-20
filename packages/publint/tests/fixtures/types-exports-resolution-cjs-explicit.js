export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-resolution-cjs-explicit',
    version: '0.0.1',
    private: true,
    type: 'module',
    types: './main.d.mts',
    exports: {
      '.': {
        types: './main.d.mts',
        default: './main.cjs',
      },
    },
  }),
  'main.cjs': '',
  'main.d.mts': '',
}
