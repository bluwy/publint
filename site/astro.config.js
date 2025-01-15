import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import svelte from '@astrojs/svelte'
import unocss from '@unocss/astro'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

// https://astro.build/config
export default defineConfig({
  // Don't need sitemap for now
  // site: 'https://publint.dev',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            ariaHidden: 'true',
            tabIndex: -1,
            className: 'anchor',
          },
          test: ['h2', 'h3', 'h4', 'h5', 'h6'],
          content: {
            type: 'element',
            tagName: 'svg',
            properties: {
              width: '24',
              height: '24',
              fill: 'currentColor',
            },
            children: [
              {
                type: 'element',
                tagName: 'use',
                properties: {
                  'xlink:href': '#autolink-icon', // Symbol defined in rules.html
                },
              },
            ],
          },
        },
      ],
    ],
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
      entries: ['./src/app/**/*.svelte', './src/app/utils/worker.js'],
    },
    plugins: [spaFallback(), serveAnalysisJson()],
    esbuild: {
      legalComments: 'none',
    },
  },
})

/**
 * We need `src/pages/index.astro` to be an SPA fallback, matching the same behavior after deploying
 * on Cloudflare Pages. We can't use `[...slug].astro` as it only supports specifying known routes.
 * @returns {import('vite').Plugin}
 */
function spaFallback() {
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

/**
 * Serve /analysis.json in dev (Handled as Cloudflare worker in prod)
 * @returns {import('vite').Plugin}
 */
function serveAnalysisJson() {
  const analysisJsonUrl = new URL(
    '../analysis/cache/_results.json',
    import.meta.url,
  )

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
