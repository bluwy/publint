import { defineConfig } from '@unocss/vite'
import extractorSvelte from '@unocss/extractor-svelte'
import presetUno from '@unocss/preset-uno'

export default defineConfig({
  extractors: [extractorSvelte],
  presets: [presetUno()],
  content: {
    filesystem: ['src/app/**/*'],
    pipeline: {
      include: [/\.(svelte|mdx?|astro|html)($|\?)/, 'src/app/utils/colors.js'],
    },
  },
  theme: {
    colors: {
      primary: '#E69B57',
      primaryLight: '#E6AB73',
      primaryDark: '#CF7522',
    },
  },
  shortcuts: {
    'anchor-link':
      'font-medium decoration-none hover:text-primary-dark focus:text-primary-dark @dark:hover:text-primary @dark:focus:text-primary transition-color',
    'action-button':
      'font-medium decoration-none px-4 py-3 border-none rounded hover:bg-primary-light focus:bg-primary-light @dark:hover:bg-primary-dark @dark:focus:bg-primary-dark transition-background-color cursor-pointer',
  },
})
