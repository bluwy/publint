import p from 'picocolors'

export function strong(str: string) {
  return p.bold(str)
}

export function warn(str: string) {
  return p.yellow(str)
}
