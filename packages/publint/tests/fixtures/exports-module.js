export default {
  'package.json': JSON.stringify({
    name: 'publint-exports-module',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    exports: {
      '.': {
        import: './main.mjs',
        require: './main.js',
        module: './main.mjs',
      },
    },
  }),
  'main.js': "module.exports = 'foo'",
  'main.mjs': "export const foo = 'bar'",
}
