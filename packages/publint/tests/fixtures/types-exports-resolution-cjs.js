export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-resolution-cjs',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    types: './main.d.ts',
    exports: {
      '.': {
        types: './main.d.ts',
        default: './main.js',
      },
    },
  }),
  'main.d.ts': '',
  'main.js': '',
}
