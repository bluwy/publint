import {
  getCodeFormat,
  getCodeFormatExtension,
  getFilePathFormat,
  getPublishedField,
  isExplicitExtension,
  isFilePathLintable
} from '../utils.js'

export function fallbackIndexPlugin() {
  return {
    name: 'core:fallback-index',
    async setup(api) {
      const [main, mainPkgPath] = getPublishedField(api.packageJson, 'main')

      if (main != null) {
        if (!api.ensureTypeOfField(main, ['string'], mainPkgPath)) return
        const mainPath = api.vfs.pathJoin(api.pkgDir, main)
        const mainContent = await api.readFile(mainPath, mainPkgPath, [
          '.js',
          '/index.js'
        ])
        if (mainContent === false) return
        if (api.hasInvalidJsxExtension(main, mainPkgPath)) return
        if (!isFilePathLintable(main)) return
        const actualFormat = getCodeFormat(mainContent)
        const expectFormat = await getFilePathFormat(mainPath, api.vfs)
        if (
          actualFormat !== expectFormat &&
          actualFormat !== 'unknown' &&
          actualFormat !== 'mixed'
        ) {
          const actualExtension = api.vfs.getExtName(mainPath)
          api.report({
            code: isExplicitExtension(actualExtension)
              ? 'FILE_INVALID_EXPLICIT_FORMAT'
              : 'FILE_INVALID_FORMAT',
            args: {
              actualFormat,
              expectFormat,
              actualExtension,
              expectExtension: getCodeFormatExtension(actualFormat)
            },
            path: mainPkgPath,
            type: 'warning'
          })
        }
        if (actualFormat === 'ESM' && exports == null) {
          api.report({
            code: 'HAS_ESM_MAIN_BUT_NO_EXPORTS',
            args: {},
            path: mainPkgPath,
            type: 'suggestion'
          })
        }
      }
    }
  }
}
