export default {
  'package.json': JSON.stringify({
    name: 'publint-invalid-repository-value-shorthand-nested',
    version: '0.0.1',
    private: true,
    type: 'commonjs',
    repository: 'gitlab:org/user/repo',
  }),
}
