import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import unocss from '@unocss/vite'

export default defineConfig({
  optimizeDeps: {
    // Vite's scanner doesn't scan references via `new URL(...)`.
    // In this app, we import the worker with the syntax, so manually add the worker for now.
    // TODO: Fix this in Vite
    entries: ['**/*.html', './src/utils/worker.js']
  },
  plugins: [
    spaFallbackWithDot(),
    unocss(),
    svelte({
      experimental: {
        prebundleSvelteLibraries: true,
        useVitePreprocess: true
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: new URL('/index.html', import.meta.url).pathname,
        rules: new URL('/rules.html', import.meta.url).pathname
      }
    }
  }
})

/**
 * Vite doesn't handle fallback html with dot (.), see https://github.com/vitejs/vite/issues/2415
 * TODO: Review the PR in Vite
 * @returns {import('vite').Plugin}
 */
function spaFallbackWithDot() {
  return {
    name: 'spa-fallback-with-dot',
    configureServer(server) {
      return () => {
        server.middlewares.use(function customSpaFallback(req, res, next) {
          if (req.url.includes('.') && !req.url.endsWith('.html')) {
            req.url = '/index.html'
          }
          next()
        })
      }
    }
  }
}
