export interface Position {
  /** 1-based */
  line: number
  /** 0-based */
  column: number
}

/** Path to the file only */
type LocationPath = string
/** Path to file with line and column */
type LocationFileWithLineColumn = {
  path: string
  start: number | Position
  end?: number | Position
}
/** Path to JSON file with specific keys */
type LocationJsonWithKeys = { path: string; keys: string[] }

export interface Issue {
  type: 'suggestion' | 'warning' | 'error'
  rule: string
  message: string
  location: LocationPath | LocationFileWithLineColumn | LocationJsonWithKeys
}

export interface ResolvedIssue extends Issue {
  pluginName: string
}

export function sortResolvedIssues(issues: ResolvedIssue[]) {
  return issues.sort((a, b) => {
    return (
      // 1. Sort by location, package.json should always come first, then others alphabetically
      compareLocationPath(a, b) ||
      // 2. Sort by plugin name
      a.pluginName.localeCompare(b.pluginName) ||
      // 3. Sort by rule name
      a.rule.localeCompare(b.rule)
    )
  })
}

function compareLocationPath(a: ResolvedIssue, b: ResolvedIssue) {
  const aLocationPath =
    typeof a.location === 'string' ? a.location : a.location.path
  const bLocationPath =
    typeof b.location === 'string' ? b.location : b.location.path
  if (aLocationPath === 'package.json' && bLocationPath !== 'package.json')
    return -1
  if (aLocationPath === 'package.json' && bLocationPath === 'package.json')
    return 1
  return aLocationPath.localeCompare(bLocationPath)
}
