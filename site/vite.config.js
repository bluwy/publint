import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import unocss from '@unocss/vite'

export default defineConfig({
  plugins: [
    jsUntar(),
    unocss(),
    svelte({
      experimental: {
        prebundleSvelteLibraries: true,
        useVitePreprocess: true
      }
    })
  ]
})

function jsUntar() {
  return {
    name: 'js-untar-shim',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('js-untar')) {
        // Web worker is not happy with window
        return code.replace(/\bwindow\b/g, 'self')
      }
    }
  }
}
