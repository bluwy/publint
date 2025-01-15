import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import svelte from '@astrojs/svelte'
import unocss from '@unocss/astro'

// https://astro.build/config
export default defineConfig({
  // Don't need sitemap for now
  // site: 'https://publint.dev',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    starlight({
      title: 'publint',
      social: {
        github: 'https://github.com/publint/publint',
      },
      sidebar: [],
      disable404Route: true,
      expressiveCode: {
        themes: ['dark-plus', 'light-plus'],
      },
      // Re-enable this when have actual docs
      pagefind: false,
    }),
    svelte(),
    unocss(),
  ],
  vite: {
    envPrefix: 'VITE_',
    optimizeDeps: {
      // Vite's scanner doesn't scan references via `new URL(...)`.
      // In this app, we import the worker with the syntax, so manually add the worker for now.
      // TODO: Fix this in Vite
      entries: ['./src/components/*.svelte', './src/utils/worker.js'],
    },
    plugins: [serveAnalysisJson()],
    esbuild: {
      legalComments: 'none',
    },
  },
})

const analysisJsonUrl = new URL(
  '../analysis/cache/_results.json',
  import.meta.url,
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
            'https://gist.github.com/bluwy/64b0c283d8f0f3f8a8f4eea03c75a3b8/raw/publint_analysis.json',
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
    },
  }
}
