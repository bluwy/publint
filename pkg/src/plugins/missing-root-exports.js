import { getPublishedField } from '../utils.js'

export function missingRootExportsPlugin() {
  return {
    name: 'core:missing-root-exports',
    setup(api) {
      const [main] = getPublishedField(api.packageJson, 'main')
      const [module] = getPublishedField(api.packageJson, 'module')
      const [exports, exportsPkgPath] = getPublishedField(
        api.packageJson,
        'exports'
      )

      // if main or module is exists, and exports exists, check if there's a root
      // entrypoint in exports. it may be mistaken that exports can be used to define
      // nested entrypoints only (missing the root entrypoint)
      if ((main != null || module != null) && exports != null) {
        let hasRootExports = true
        if (typeof exports == 'object') {
          const exportsKeys = Object.keys(exports)
          // an exports object could contain conditions, or paths that maps to other objects.
          // we can determine the type of the object by checking one of the keys ([0])
          // if it's a path, which we can then proceed to check if it has the root path
          if (exportsKeys[0]?.startsWith('.') && !exportsKeys.includes('.')) {
            hasRootExports = false
          }
        }
        if (!hasRootExports) {
          const mainField = main != null ? 'main' : 'module'
          api.report({
            type: 'warning',
            message: `${exportsPkgPath} is missing the root entrypoint export, which is defined in ${'pkg.' + mainField}. Environments that support the ${'"exports"'} field will ignore ${'pkg.' + mainField} as ${'"exports"'} takes the highest priority.`
          })
        }
      }
    }
  }
}
