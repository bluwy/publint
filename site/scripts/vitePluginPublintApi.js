import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fss from 'node:fs'

const replaceKey = 'vite-plugin-publint-api'
const replaceInFiles = ['src/content/docs/docs/javascript-api.mdx']
const publintIndexDtsPath = fileURLToPath(
  new URL('../../packages/publint/src/index.d.ts', import.meta.url),
)

/**
 * This plugin parse the publint index.d.ts file and replace as a formatted
 * markdown for display
 * @returns {import('vite').Plugin}
 */
export function publintApi() {
  /** @type {string | undefined} */
  let optionsDocs

  function getOptionsDocs() {
    if (!optionsDocs) {
      const code = fss.readFileSync(publintIndexDtsPath, 'utf-8')
      const sourcefile = parseTypeScript(code, publintIndexDtsPath)
      optionsDocs = ''

      /** @type {ts.InterfaceDeclaration} */
      const optionsInterfaceAst = sourcefile.statements.find(
        (s) => ts.isInterfaceDeclaration(s) && s.name.text === 'Options',
      )
      if (!optionsInterfaceAst)
        throw new Error('Unable to find Options interface')
      for (const member of optionsInterfaceAst.members) {
        if (ts.isPropertySignature(member)) {
          const optionName = trim(member.name.text)
          const optionType = trim(code.slice(member.type.pos, member.type.end))
          // NOTE: node.jsDoc is untyped but probably safe to use
          const optionDocs = trim(member.jsDoc?.[0]?.comment)

          optionsDocs += `
### ${optionName}

**Type:** ${optionType.includes('\n') ? `\n\`\`\`ts\n${optionType}\n\`\`\`` : `\`${optionType}\``}

${optionDocs}`
        }
      }
    }
    return optionsDocs
  }

  return {
    name: 'publint-api',
    enforce: 'pre',
    buildStart() {
      optionsDocs = undefined
    },
    transform(code, id) {
      if (
        replaceInFiles.some((f) => id.endsWith(f)) &&
        code.includes(replaceKey)
      ) {
        const docs = getOptionsDocs()
        // NOTE: maybe emit sourcemap in the future
        return code.replace(replaceKey, docs)
      }
    },
  }
}

/**
 * @param {string} code
 * @param {string} id
 */
function parseTypeScript(code, id) {
  const sourceFile = ts.createSourceFile(
    path.basename(id),
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  return sourceFile
}

/**
 * Trim and remove leading spaces if multiline
 * @param {string | undefined} str
 */
function trim(str) {
  if (!str) {
    return ''
  } else if (str.includes('\n')) {
    return str
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
  } else {
    return str.trim()
  }
}
