import {
  getCodeFormat,
  getFilePathFormat,
  getPublishedField
} from '../utils.js'

export function fallbackIndexPlugin() {
  return {
    name: 'core:fallback-index',
    async setup(api) {
      const [main] = getPublishedField(api.packageJson, 'main')
      const [exports] = getPublishedField(api.packageJson, 'exports')

      // Relies on default node resolution
      // https://nodejs.org/api/modules.html#all-together
      // LOAD_INDEX(X)
      if (main == null && exports == null) {
        // check index.js only, others aren't our problem
        const defaultPath = api.vfs.pathJoin(api.pkgDir, 'index.js')
        if (await api.vfs.isPathExist(defaultPath)) {
          const defaultContent = await api.readFile(defaultPath, [])
          if (defaultContent === false) return
          const actualFormat = getCodeFormat(defaultContent)
          const expectFormat = await getFilePathFormat(defaultPath, api.vfs)
          if (
            actualFormat !== expectFormat &&
            actualFormat !== 'unknown' &&
            actualFormat !== 'mixed'
          ) {
            api.report({
              code: 'IMPLICIT_INDEX_JS_INVALID_FORMAT',
              args: {
                actualFormat,
                expectFormat
              },
              path: ['name'],
              type: 'warning'
            })
          }
        }
      }
    }
  }
}
