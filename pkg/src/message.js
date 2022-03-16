/**
 * @param {import('types').Message} m
 */
export function printMessage(m) {
  switch (m.code) {
    case 'IMPLICIT_INDEX_JS_INVALID_FORMAT':
      return `index.js should be ${m.args.expectFormat} but it is ${m.args.actualFormat}`
    default:
    // TODO
  }
}
