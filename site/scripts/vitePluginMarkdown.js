import fs from 'node:fs/promises'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'
import { fileURLToPath } from 'node:url'
import { rehypeShikiji } from './rehypeShikiji.js'

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
    .use(rehypeShikiji)
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
        const rulesHtml = (await markdownProcessor.process(markdown)).toString()
        const tocHtml = getTocHtml(rulesHtml)
        return html
          .replace('<!-- rules.md -->', rulesHtml)
          .replace('<!-- rules.md (aside) -->', tocHtml)
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

/**
 * @param {string} rulesHtml
 */
function getTocHtml(rulesHtml) {
  const idMatch = /<h2\s*id="(.*?)">/g
  /** @type {string[]} */
  const links = []
  let m
  while ((m = idMatch.exec(rulesHtml))) {
    links.push(m[1])
  }
  return `\
<ul>
  ${links.map((link) => `<li><a href="#${link}">${link}</a></li>`).join('\n')}
</ul>`
}
