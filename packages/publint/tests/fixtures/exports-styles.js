export default {
  'package.json': JSON.stringify({
    name: 'publint-exports-styles',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    exports: {
      './array': {
        import: ['./array.js', './non-existent.js', 'std:lib'],
      },
      './array-direct': ['./array.js', './non-existent.js'],
    },
  }),
  'array.js': "export const foo = 'bar'",
}
