export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-resolution-dual',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    types: './main-special.d.ts',
    exports: {
      '.': {
        import: './main.js',
        require: './main.cjs',
      },
    },
  }),
  'main-special.d.cts': '',
  'main-special.d.ts': '',
  'main.cjs': '',
  'main.js': '',
}
