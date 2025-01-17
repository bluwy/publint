import fs from 'node:fs/promises'

const analysisJsonUrl = new URL(
  '../../analysis/cache/_results.json',
  import.meta.url,
)

/** @type {import('vite').Connect.Server} */
const analysisJsonMiddleware = async (req, res, next) => {
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
}

/**
 * Serve /analysis.json in dev (Handled as Cloudflare worker in prod)
 * @returns {import('vite').Plugin}
 */
export function serveAnalysisJson() {
  return {
    name: 'serve-analysis-json',
    configureServer(server) {
      server.middlewares.use(analysisJsonMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(analysisJsonMiddleware)
    },
  }
}
