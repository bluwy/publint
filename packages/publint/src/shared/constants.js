// extensions that publint is able to parse and lint. while there's partial support
// for TypeScript, it's not completely safe to do so in a check yet
export const lintableFileExtensions = ['.js', '.mjs', '.cjs']

// common misconception that JSX is also affected by "m" and "c" semantics
export const invalidJsxExtensions = ['.mjsx', '.cjsx', '.mtsx', '.cjsx']

// Some exports condition are known to be similar to the browser condition but
// runs slightly different. Specifically, the `pkg.browser` field will be applied
// even after resolving with these export conditions, which can be confusing at times.
export const knownBrowserishConditions = [
  'worker',
  // Cloudflare Workers: https://runtime-keys.proposal.wintercg.org/#workerd
  'workerd',
  // Vercel Edge: https://runtime-keys.proposal.wintercg.org/#edge-light
  'edge-light',
]

// NOTE: this list is intentionally non-exhaustive and subjective as it's used for
// loose detection purpose for `pkg.files` recommendation only. please dont submit
// a PR to extend it.
export const commonInternalPaths = [
  // directories
  'test/',
  'tests/',
  '__tests__/',
  // files
  '.prettierrc',
  'prettier.config.js',
  '.eslintrc',
  '.eslintrc.js',
]

// https://github.com/npm/npm-packlist/blob/53b2a4f42b7fef0f63e8f26a3ea4692e23a58fed/lib/index.js#L284-L286
export const licenseFiles = [/^copying/i, /^licence/i, /^license/i]
