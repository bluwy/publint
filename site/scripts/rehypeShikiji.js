import { visit, SKIP } from 'unist-util-visit'
import { codeToHast } from 'shikiji'

/**
 * @returns {import('unified').Transformer}
 */
export function rehypeShikiji() {
  return async (tree) => {
    /** @type {typeof tree[]} */
    const preNodes = []

    // visit is sync only
    visit(tree, async (node) => {
      if (node.type === 'element' && node.tagName === 'pre') {
        preNodes.push(node)
        return SKIP
      }
    })

    for (const node of preNodes) {
      const codeNode = node.children?.[0]

      const language = codeNode.properties?.className?.[0]?.replace(
        'language-',
        ''
      )
      if (!language) return

      const code = codeNode.children?.[0]?.value
      if (!code) return

      const codeHast = await codeToHast(code, {
        lang: language,
        themes: {
          light: 'light-plus',
          dark: 'dark-plus'
        }
      })

      const preHast = codeHast.children[0]
      // too bright
      preHast.properties.style = preHast.properties.style.replace(
        'background-color:#FFFFFF',
        'background-color:#f3f0f0'
      )

      Object.assign(node, preHast)
    }
  }
}
