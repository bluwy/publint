<script>
  import selectIcon from '../assets/select.svg'
  import { url } from '../utils/url'
  import Loading from './Loading.svelte'

  /** @type {string} */
  export let version
  /** @type {string} */
  export let pkgName

  /** @type {string[]} */
  let versions = []
  /** @type {Record<string, string>} */
  let tags = {}
  let versionsLoading = false
  let versionsLoaded = false

  /**
   * The index of the showed choices when selecting via up/down arrows
   */
  let arrowSelectIndex = -1

  function getTagForVersion(version) {
    return Object.entries(tags).find(([, v]) => v === version)?.[0]
  }

  function handleClick(e) {

    e.target.closest('button')?.focus()
    
    if (versionsLoading || versionsLoaded) return
    versionsLoading = true

    // fetch package versions from jsdelivr as it returns a smaller payload
    fetch(
      // prettier-ignore
      `${import.meta.env.VITE_JSDELIVR_API}/packages/npm/${encodeURIComponent(pkgName)}`,
      {
        headers: {
          'User-Agent': 'publint'
        }
      }
    )
      .then((data) => data.ok && data.json())
      .then((data) => {
        versions = data.versions.map((v) => v.version)
        tags = data.tags
      })
      .finally(() => {
        versionsLoading = false
        versionsLoaded = true
      })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && versions[arrowSelectIndex]) {
      url.push(`/${pkgName}@${versions[arrowSelectIndex]}`)
    } else if (e.key === 'Escape') {
      versionsLoaded = false
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="relative group z-100" on:keydown={handleKeyDown}>
  <span class="opacity-80 font-400 text-lg">{version}</span>

  <button
    class="inline-flex justify-center items-center active:bg-white p-0 m-0 w-4 h-4 border-0 rounded bg-gray-300 @dark:bg-gray-700"
    on:click={handleClick}
  >
    {#if !versionsLoading}
      <img
        class="block p-0 m-0 @dark:filter-invert"
        src={selectIcon}
        alt="select icon"
        height="16"
      />
    {:else}
      <Loading size={14} />
    {/if}
  </button>

  {#if versionsLoaded && versions.length}
    <!--
      Set tabindex="-1" to prevent focus going into the list. Instead that can use
      keyboard arrow keys to navigate, while the ARIA labels will fill in the gap.
    -->
    <ul
      class="group-focus-within:block hidden absolute right-0 rounded-md list-none m-0 p-0 max-h-[70vh] overflow-x-hidden overflow-y-auto border-0 border-t border-gray bg-gray-300 @dark:bg-gray-700"
      tabindex="-1"
      role="listbox"
    >
      {#each versions as v, i}
        {@const tag = getTagForVersion(v)}
        <li
          class="m-0 py-0 bg-gray bg-opacity-0 hover:bg-opacity-25 transition-colors"
          class:bg-opacity-25={arrowSelectIndex === i}
          role="option"
          aria-selected={arrowSelectIndex === i}
        >
          <a
            class="bg-transparent flex justify-between m-0 pl-2 pr-6 py-0.5 border-none whitespace-nowrap decoration-none text-sm w-full block text-left font-normal"
            href={`/${pkgName}@${v}`}
          >
            {v}&nbsp;
            {#if tag}
              <span class="opacity-80">({tag})</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</span>
