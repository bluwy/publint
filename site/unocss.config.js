import { defineConfig } from '@unocss/vite'
import { extractorSvelte } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  extractors: [extractorSvelte],
  presets: [presetUno()]
})
