import { derived, writable } from 'svelte/store'

// https://github.com/bluwy/svelte-url
function createUrlStore() {
  // Ideally a bundler constant so that it's tree-shakable
  if (typeof window === 'undefined') {
    const { subscribe } = writable('')
    return { subscribe }
  }

  const href = writable(window.location.href)
  const updateHref = () => href.set(window.location.href)

  const _pushState = history.pushState
  history.pushState = function () {
    // @ts-expect-error
    _pushState.apply(this, arguments)
    updateHref()
  }

  const _replaceState = history.replaceState
  history.replaceState = function () {
    // @ts-expect-error
    _replaceState.apply(this, arguments)
    updateHref()
  }

  window.addEventListener('popstate', updateHref)
  window.addEventListener('hashchange', updateHref)

  return {
    subscribe: derived(href, ($href) => new URL($href)).subscribe,
  }
}

export const url = {
  subscribe: createUrlStore().subscribe,
  push: (/** @type {string} */ url) => history.pushState(null, '', url),
  replace: (/** @type {string} */ url) => history.replaceState(null, '', url),
}
