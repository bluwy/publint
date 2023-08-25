import './global.css'
import 'uno.css'

setHashActive(window.location.hash, true)

window.addEventListener('hashchange', (e) => {
  setHashActive(new URL(e.oldURL).hash, false)
  setHashActive(new URL(e.newURL).hash, true)
})

/**
 * @param {string} hash
 * @param {boolean} active
 */
function setHashActive(hash, active) {
  hash = hash.replace('#', '')
  if (!hash) return
  const heading = document.getElementById(hash)
  const tocLink = document.querySelector(`.rules-aside-toc [href="#${hash}"]`)
  if (!heading || !tocLink) return
  if (active) {
    heading.classList.add('active')
    tocLink.classList.add('active')
  } else {
    heading.classList.remove('active')
    tocLink.classList.remove('active')
  }
}
