import { url } from './url'

const specialPages = ['/rules']

export function listenUrlClick() {
  document.addEventListener('click', (e) => {
    if (
      e.button ||
      e.which !== 1 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.defaultPrevented
    ) {
      return
    }

    const target = /** @type {HTMLElement} */ (e.target)
    const anchor = target.closest('a')
    if (!anchor) {
      return
    }

    const href = anchor.getAttribute('href')

    if (
      href?.startsWith('/') &&
      specialPages.every((page) => !href.startsWith(page))
    ) {
      url.push(href)
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      })
      e.preventDefault()
    }
  })
}
