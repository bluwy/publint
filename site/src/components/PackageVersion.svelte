<script>
  import selectIcon from '../assets/select.svg'
  import Loading from './Loading.svelte'
  import { clickOutside } from '../utils/click-outside'
  import { url } from '../utils/url'

  // maybe be undefined if visit page without version yet
  /** @type {string | undefined} */
  export let version
  /** @type {string} */
  export let pkgName

  /** @type {string[]} */
  let versions = []
  /** @type {Record<string, string>} */
  let tags = {}
  let versionsLoading = false
  let versionsLoaded = false

  // reset fetched version when changing packages
  $: if ($url) {
    versionsLoading = false
    versionsLoaded = false
  }

  let open = false

  function getTagForVersion(version) {
    return Object.entries(tags).find(([, v]) => v === version)?.[0]
  }

  function handleClick() {
    open = !open

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
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  class="relative z-100"
  use:clickOutside
  on:clickoutside={() => {
    if (versionsLoading) return
    open = false
  }}
  on:focusout={() => (open = false)}
  on:keydown={(e) => {
    if (e.key === 'Escape') open = false
  }}
>
  <span class="opacity-80 font-400 text-lg">{version || ''}</span>

  <button
    class="inline-flex justify-center items-center active:bg-white p-0 m-0 w-4 h-4 border-0 rounded bg-gray-400 @dark:bg-gray-600 hover:bg-gray-500 focus:bg-gray-500 active:bg-gray-500 transition-colors"
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

  {#if versionsLoaded && versions.length && open}
    <!--
      Set tabindex="-1" to prevent focus going into the list. Instead that can use
      keyboard arrow keys to navigate, while the ARIA labels will fill in the gap.
    -->
    <ul
      class="absolute right-0 rounded-md list-none m-0 p-0 max-h-[70vh] overflow-x-hidden overflow-y-auto border-0 border-t border-gray bg-gray-300 @dark:bg-gray-700"
      tabindex="-1"
      role="listbox"
    >
      {#each versions as v}
        {@const tag = getTagForVersion(v)}
        <li
          class="m-0 py-0 bg-gray bg-opacity-0 hover:bg-opacity-25 focus-within:bg-opacity-25 transition-colors"
        >
          <a
            class="bg-transparent m-0 pl-2 pr-4.5 py-0.5 border-none whitespace-nowrap decoration-none text-sm w-full block text-left font-normal"
            href={`/${pkgName}@${v}`}
            on:click={() => (open = false)}
          >
            <span>{v}</span>
            {#if tag}
              <span class="opacity-80">({tag})</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</span>
