import { preview } from 'vite'
import { serveAnalysisJson } from './vitePluginAnalysisJson.js'

// Use Vite's preview server instead of Astro as we want to use `vitePluginAnalysisJson`
// and rely on `appType: 'spa'` instead of mpa
const server = await preview({
  configFile: false,
  plugins: [serveAnalysisJson()],
})
server.printUrls()
server.bindCLIShortcuts({ print: true })
