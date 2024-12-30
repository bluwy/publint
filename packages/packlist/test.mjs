import { fileURLToPath } from 'url'
import { packlist } from './src/index.js'

const list = await packlist(fileURLToPath(new URL('./', import.meta.url)), {
  packageManager: 'pnpm'
})
console.log('a', list)
