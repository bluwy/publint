export default {
  'package.json': JSON.stringify({
    name: 'publint-no-exports-module',
    version: '0.0.1',
    private: true,
    type: 'module',
  }),
  'react.cjs.native.js': `
    // .native.js extensions are always CJS despite closest package.json \`"type": "module"\`
    module.exports = 'react-native'
  `,
}
