export default {
  'package.json': JSON.stringify({
    name: 'publint-types-exports-resolution-custom-conditions',
    version: '0.0.1',
    private: true,
    type: 'module',
    types: './import.d.ts',
    exports: {
      '.': {
        'edge-light': {
          types: './edge-light.d.ts',
          default: './edge-light.js',
        },
        browser: {
          types: './browser.d.ts',
          default: './browser.d.js',
        },
        worker: {
          types: './worker.d.ts',
        },
        types: './import.d.ts',
        require: './require.cjs',
        import: './import.js',
      },
    },
  }),
  'edge-light.d.ts': '',
  'edge-light.js': '',
  'browser.d.ts': '',
  'browser.d.js': '',
  'worker.d.ts': '',
  'import.d.ts': '',
  'require.cjs': '',
  'import.js': '',
}
