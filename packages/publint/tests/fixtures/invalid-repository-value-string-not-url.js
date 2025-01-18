export default {
  'package.json': JSON.stringify({
    name: 'publint-invalid-repository-value-string-not-url',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    repository: 'not_an_url',
  }),
}
