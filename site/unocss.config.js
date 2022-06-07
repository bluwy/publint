import { defineConfig } from '@unocss/vite'
import { extractorSvelte } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  extractors: [extractorSvelte],
  presets: [presetUno()],
  theme: {
    colors: {
      primary: '#E69B57'
    }
  },
  shortcuts: {
    'anchor-link':
      'font-bold decoration-none hover:text-primary focus:text-primary transition-color'
  }
})
