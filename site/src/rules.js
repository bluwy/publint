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
  console.log('as')
  hash = hash.replace('#', '')
  if (!hash) return
  const heading = document.getElementById(hash)
  if (!heading) return
  if (active) {
    heading.classList.add('active')
  } else {
    heading.classList.remove('active')
  }
}

function renderAsideMenu() {
  const hashElements = document.querySelectorAll('h2')
  const ul = document.createElement('ul')
  ul.className = 'aside-menu-list relative left-0'
  hashElements.forEach(el => {
    const text = el.id
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.className = 'aside-link'
    a.textContent = text
    a.title = text
    a.href = `#${text}`
    li.appendChild(a)
    ul.appendChild(li)
  })
  const asideMenu = document.querySelector('.aside-menu')
  asideMenu?.appendChild(ul)
}
renderAsideMenu()