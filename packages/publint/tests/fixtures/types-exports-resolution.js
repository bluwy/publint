export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-resolution',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    types: './main.d.ts',
    exports: {
      '.': {
        import: './main.js',
      },
    },
  }),
  'main.d.ts': '',
  'main.js': '',
}
