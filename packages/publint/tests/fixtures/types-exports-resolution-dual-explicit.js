export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-resolution-dual-explicit',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    types: './main-special.d.ts',
    exports: {
      '.': {
        types: './main-special.d.ts',
        import: './main.mjs',
        require: './main.js',
      },
    },
  }),
  'main-special.d.ts': '',
  'main.js': '',
  'main.mjs': '',
}
