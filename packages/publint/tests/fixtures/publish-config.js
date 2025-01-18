export default {
  'package.json': JSON.stringify({
    name: 'publint-publish-config',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    main: 'missing.js',
    browser: 'missing.js',
    exports: {
      '.': {
        import: './missing.js',
      },
    },
    publishConfig: {
      browser: 'index.js',
      exports: {
        '.': {
          import: './index.js',
          require: './index.js',
        },
      },
    },
  }),
  'index.js': '',
}
