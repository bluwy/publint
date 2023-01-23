import fs from 'node:fs/promises'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import { fileURLToPath } from 'node:url'

/**
 *
 * @returns {import('vite').Plugin}
 */
export function markdown() {
  const markdownProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      properties: {
        ariaHidden: 'true',
        tabIndex: -1,
        className: 'anchor'
      },
      test: ['h2', 'h3', 'h4', 'h5', 'h6'],
      content: {
        type: 'element',
        tagName: 'svg',
        properties: {
          width: '24',
          height: '24',
          fill: 'currentColor'
        },
        children: [
          {
            type: 'element',
            tagName: 'use',
            properties: {
              'xlink:href': '#autolink-icon' // Symbol defined in rules.html
            }
          }
        ]
      }
    })
    .use(rehypeStringify)

  const rulesPath = fileURLToPath(new URL('../rules.md', import.meta.url))

  return {
    name: 'markdown',
    transform(code, id) {
      if (!id.endsWith('.md')) return
      return `export default ${JSON.stringify(code)}`
    },
    async transformIndexHtml(html) {
      if (html.includes('<!-- rules.md -->')) {
        const markdown = await fs.readFile(rulesPath, 'utf-8')
        const rules = (await markdownProcessor.process(markdown)).toString()
        return html.replace('<!-- rules.md -->', rules)
      }
    },
    handleHotUpdate(ctx) {
      if (ctx.file === rulesPath) {
        ctx.server.ws.send({
          type: 'full-reload',
          path: '/rules'
        })
      }
    }
  }
}
