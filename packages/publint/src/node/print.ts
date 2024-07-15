import type { Result, Vfs } from '../shared/types.js'
import c from 'picocolors'
import { codeFrameColumns } from '@babel/code-frame'
import { Position } from '../shared/plugin-engine/issue.js'

export async function printResult(result: Result) {
  for (const issue of result.issues) {
    const color =
      issue.type === 'error'
        ? c.red
        : issue.type === 'warning'
          ? c.yellow
          : c.blue

    console.log(`${color('[' + issue.rule + ']')} ${issue.message}`)

    const loc = issue.location
    if (typeof loc === 'string') {
      console.log(`${c.bold('File:')} ${loc}`)
    } else if ('start' in loc) {
      const file = await result.vfs.readFile(loc.path)
      const start = offsetToLocation(file, loc.start)
      const end = loc.end != null ? offsetToLocation(file, loc.end) : undefined
      console.log(codeFrameColumns(file, { start, end }))
    } else if ('keys' in loc) {
      console.log(`${c.bold('File:')} ${loc.path}`)
      // TODO: code frames
    }

    console.log()
  }
}

const splitRE = /\r?\n/g

// Code from Vite
function offsetToLocation(source: string, offset: number | Position): Position {
  if (typeof offset !== 'number') return offset
  if (offset > source.length) {
    throw new Error(
      `offset is longer than source length! offset ${offset} > length ${source.length}`
    )
  }
  const lines = source.split(splitRE)
  let counted = 0
  let line = 0
  let column = 0
  for (; line < lines.length; line++) {
    const lineLength = lines[line].length + 1
    if (counted + lineLength >= offset) {
      column = offset - counted + 1
      break
    }
    counted += lineLength
  }
  return { line: line + 1, column }
}
