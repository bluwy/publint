import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import svelte from '@astrojs/svelte'
import unocss from '@unocss/astro'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { cloudflareRedirect } from 'vite-plugin-cloudflare-redirect'
import { publintHelp } from './scripts/vitePluginPublintHelp.js'
import { publintApi } from './scripts/vitePluginPublintApi.js'
import { spaFallback } from './scripts/vitePluginSpaFallback.js'
import { serveAnalysisJson } from './scripts/vitePluginAnalysisJson.js'

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
      logo: { src: './src/assets/logo.svg' },
      social: {
        github: 'https://github.com/publint/publint',
      },
      customCss: ['/src/starlight-custom.css'],
      sidebar: [
        { label: 'Home', link: '/' },
        {
          label: 'Guide',
          items: [
            { slug: 'docs/getting-started' },
            { slug: 'docs/cli' },
            { slug: 'docs/javascript-api' },
            { slug: 'docs/comparisons' },
          ],
        },
      ],
      disable404Route: true,
      expressiveCode: {
        themes: ['dark-plus', 'light-plus'],
      },
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
    plugins: [
      cloudflareRedirect(),
      publintHelp(),
      publintApi(),
      spaFallback(),
      serveAnalysisJson(),
    ],
    esbuild: {
      legalComments: 'none',
    },
  },
})
