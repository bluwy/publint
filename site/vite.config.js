import fs from 'node:fs/promises'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import unocss from '@unocss/vite'
import { markdown } from './scripts/vitePluginMarkdown.js'

export default defineConfig({
  optimizeDeps: {
    // Vite's scanner doesn't scan references via `new URL(...)`.
    // In this app, we import the worker with the syntax, so manually add the worker for now.
    // TODO: Fix this in Vite
    entries: ['**/*.html', './src/utils/worker.js']
  },
  plugins: [
    spaFallbackWithDot(),
    serveAnalysisJson(),
    unocss(),
    svelte(),
    markdown()
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
        server.middlewares.use((req, res, next) => {
          if (req.url.includes('.') && !req.url.endsWith('.html')) {
            req.url = '/index.html'
          }
          next()
        })
      }
    }
  }
}

const analysisJsonUrl = new URL(
  '../analysis/cache/_results.json',
  import.meta.url
)

/**
 * Serve /analysis.json in dev (Handled as Cloudflare worker in prod)
 * @returns {import('vite').Plugin}
 */
function serveAnalysisJson() {
  /**
   * @param {import('vite').Connect.Server} middlewares
   */
  function addMiddleware(middlewares) {
    middlewares.use(async (req, res, next) => {
      if (req.url === '/analysis.json') {
        res.setHeader('Content-Type', 'application/json')

        // try load local analysis result
        try {
          res.end(await fs.readFile(analysisJsonUrl))
          return
        } catch {
          // file does not exist
        }

        // try pre-analysed result
        try {
          const result = await fetch(
            'https://gist.github.com/bluwy/64b0c283d8f0f3f8a8f4eea03c75a3b8/raw/publint_analysis.json'
          )
          const buffer = await result.arrayBuffer()
          res.end(new Uint8Array(buffer))
          return
        } catch {
          // failed to fetch
        }
      }

      next()
    })
  }

  return {
    name: 'serve-analysis-json',
    configureServer(server) {
      addMiddleware(server.middlewares)
    },
    configurePreviewServer(server) {
      addMiddleware(server.middlewares)
    }
  }
}
