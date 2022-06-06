// @unocss-include

/**
 * @param {'error' | 'warning' | 'suggestion' | 'success'} type
 * @returns
 */
export function messageTypeToColor(type) {
  switch (type) {
    case 'error':
      return 'border-red-400 bg-red-300 text-black'
    case 'warning':
      return 'border-yellow-400 bg-yellow-300 text-black'
    case 'suggestion':
      return 'border-blue-400 bg-blue-300 text-black'
    case 'success':
      return 'border-green-400 bg-green-300 text-black'
    default:
      return ''
  }
}
