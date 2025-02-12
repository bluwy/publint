export default {
  'package.json': JSON.stringify({
    name: 'publint-missing-files',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    main: 'missing.js',
    'jsnext:main': './missing.js',
    jsnext: './missing.js',
    browser: {
      './server/code.js': './browser/code.js',
      'some-module': false,
    },
    types: './missing.d.ts',
    exports: {
      '.': {
        types: './missing.d.ts',
        bun: './missing.ts',
        import: './missing.js',
      },
      './not-published': './not-published.js',
    },
    files: ['package.json'],
    bin: 'missing.js',
  }),
  'not-published.js': '',
}
