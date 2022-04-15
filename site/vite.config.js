import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import unocss from '@unocss/vite'

export default defineConfig({
  plugins: [
    spaFallbackWithDot(),
    unocss(),
    svelte({
      experimental: {
        prebundleSvelteLibraries: true,
        useVitePreprocess: true
      }
    })
  ]
})

/**
 * Vite doesn't handle fallback html with dot (.), see https://github.com/vitejs/vite/issues/2415
 * @returns {import('vite').Plugin}
 */
function spaFallbackWithDot() {
  return {
    name: 'spa-fallback-with-dot',
    configureServer(server) {
      return () => {
        server.middlewares.use(function customSpaFallback(req, res, next) {
          if (req.url.includes('.')) {
            req.url = '/index.html'
          }
          next()
        })
      }
    }
  }
}
