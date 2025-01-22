import cp from 'node:child_process'
import { fileURLToPath } from 'node:url'

const replaceKey = 'vite-plugin-publint-help'
const replaceInFiles = ['src/content/docs/docs/cli.mdx']
const publintCliPath = fileURLToPath(
  new URL('../../packages/publint/src/cli.js', import.meta.url),
)

/**
 * This plugin executes the `publint --help` command and replaces it in the docs
 * for display
 * @returns {import('vite').Plugin}
 */
export function publintHelp() {
  /** @type {string | undefined} */
  let helpMessage

  function getHelpMessage() {
    if (!helpMessage) {
      helpMessage = cp.execSync(`node "${publintCliPath}" --help`, {
        encoding: 'utf8',
      })
      if (!helpMessage) {
        throw new Error('Failed to get `publint --help` output')
      }
    }
    return helpMessage
  }

  return {
    name: 'publint-help',
    enforce: 'pre',
    buildStart() {
      helpMessage = undefined
    },
    transform(code, id) {
      if (
        replaceInFiles.some((f) => id.endsWith(f)) &&
        code.includes(replaceKey)
      ) {
        const message = getHelpMessage()
        // NOTE: maybe emit sourcemap in the future
        return code.replace(replaceKey, message)
      }
    },
  }
}
