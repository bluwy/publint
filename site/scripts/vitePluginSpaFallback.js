/**
 * We need `src/pages/index.astro` to be an SPA fallback, matching the same behavior after deploying
 * on Cloudflare Pages. We can't use `[...slug].astro` as it only supports specifying known routes.
 * @returns {import('vite').Plugin}
 */
export function spaFallback() {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          req.headers.accept?.includes('text/html') &&
          !req.url.startsWith('/rules') &&
          !req.url.startsWith('/docs/')
        ) {
          req.url = '/index.html'
        }

        next()
      })
    },
  }
}
