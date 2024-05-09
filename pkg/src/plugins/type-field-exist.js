// Check if "type" field is specified, help Node.js push towards an ESM default future:
// https://nodejs.org/en/blog/release/v20.10.0
export function typeFieldPlugin() {
  return {
    name: 'core:type-field-exist',
    setup(api) {
      if (api.packgeJson.type == null) {
        api.report({
          type: 'suggestion',
          message: 'Missing "type" field in package.json',
          loc: {
            file: 'package.json'
          }
        })
      }
    }
  }
}
