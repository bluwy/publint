// Some exports condition are known to be similar to the browser condition but
// runs slightly different. Specifically, the `pkg.browser` field will be applied
// even after resolving with these export conditions, which can be confusing at times.
export const knownBrowserishConditions = [
  'worker',
  // Cloudflare Workers: https://runtime-keys.proposal.wintercg.org/#workerd
  'workerd',
  // Vercel Edge: https://runtime-keys.proposal.wintercg.org/#edge-light
  'edge-light'
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
  '.eslintrc.js'
]
