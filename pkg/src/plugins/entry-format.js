import {
  getCodeFormat,
  getFilePathFormat,
  getPublishedField,
  pathJoin
} from '../utils.js'

export function entryFormatPlugin() {
  return {
    name: 'core:entry-format',
    async setup(api, pkg) {
      const [main, mainPkgPath] = getPublishedField(pkg, 'main')
      const [module, modulePkgPath] = getPublishedField(pkg, 'module')
      const [exports, exportsPkgPath] = getPublishedField(pkg, 'exports')

      api.onStart(() => {})
      api.onEnd(() => {})

      api.lint(() => {
        if (main == null && module == null && exports == null) {
          return {
            type: 'suggestion',
            message: 'Missing "main", "module" or "exports" field in package.json',
            loc: {}
          }
        }
      })

      // Relies on default node resolution
      // https://nodejs.org/api/modules.html#all-together
      // LOAD_INDEX(X)
      if (main == null && module == null && exports == null) {
        // check index.js only, others aren't our problem
        const defaultPath = pathJoin(pkgDir, 'index.js')
        if (await api.vfs.isPathExist(defaultPath)) {
          const defaultContent = await api.vfs.readFile(defaultPath, [])
          if (defaultContent === false) return
          const actualFormat = getCodeFormat(defaultContent)
          const expectFormat = await getFilePathFormat(defaultPath, api.vfs)
          if (
            actualFormat !== expectFormat &&
            actualFormat !== 'unknown' &&
            actualFormat !== 'mixed'
          ) {
            api.report({
              type: 'warning',
              message: `Entry file format should be ${expectFormat}, but got ${actualFormat}`
            })
          }
        }
      }
    }
  }
}
