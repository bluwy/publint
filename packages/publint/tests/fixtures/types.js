export default {
  'package.json': JSON.stringify({
    name: 'publint-types',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    types: './main.d.ts',
    exports: {
      '.': {
        node: {
          import: './stub.js',
        },
      },
      './nested': {
        import: {
          types: './nested.d.mts',
          default: './nested.mjs',
        },
        types: './nested.d.ts',
        default: './nested.js',
      },
    },
  }),
  'main.d.ts': '',
  'nested.d.mts': '',
  'nested.d.ts': '',
  'nested.js': '',
  'nested.mjs': '',
  'stub.js': '',
}
