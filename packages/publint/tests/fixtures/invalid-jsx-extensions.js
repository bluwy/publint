export default {
  'package.json': JSON.stringify({
    name: 'publint-invalid-jsx-extensions',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    main: './main.cjsx',
    module: './main.mjsx',
  }),
  'main.cjsx': '',
  'main.mjsx': '',
}
