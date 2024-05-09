import { commonInternalPaths } from '../constants.js'

export function noInternalFilesPlugin() {
  return {
    name: 'core:no-internal-files',
    async setup(api) {
      // Check if package published internal tests or config files
      if (api.packageJson.files == null) {
        for (const p of commonInternalPaths) {
          const internalPath = api.vfs.pathJoin(api.packageDir, p)
          if (api.packedFiles?.every((f) => !f.startsWith(internalPath))) {
            continue
          }
          if (await api.vfs.isPathExist(internalPath)) {
            api.report({
              type: 'suggestion',
              message: `Use files field`
            })
            break
          }
        }
      }
    }
  }
}
