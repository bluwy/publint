import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import unocss from '@unocss/vite'

export default defineConfig({
  plugins: [
    unocss(),
    svelte({
      experimental: {
        prebundleSvelteLibraries: true,
        useVitePreprocess: true
      }
    })
  ]
})
