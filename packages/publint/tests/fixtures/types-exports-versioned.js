export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-versioned',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    types: './main.d.ts',
    exports: {
      '.': {
        'types@>=5.2': './ts5.2/main.d.ts',
        blah: './main.js',
        'types@>=4.6': './ts4.6/main.d.ts',
        types: './main.d.ts',
        default: './main.js',
      },
    },
  }),
  'ts5.2': {
    'main.d.ts': '',
  },
  'ts4.6': {
    'main.d.ts': '',
  },
  'main.d.ts': '',
  'main.js': '',
}
