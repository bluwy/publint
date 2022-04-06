<script>
  import { debounce } from '../utils'

  /**
   * @type {string}
   */
  export let value

  /**
   * @type {string[]}
   */
  let options = []

  const getSearchResults = debounce(async () => {
    if (!value) return

    const result = await fetch(
      `${import.meta.env.VITE_NPM_SEARCH_ENDPOINT}?q=${value}&size=5`,
      {
        method: 'GET'
      }
    )

    if (result.ok) {
      const json = await result.json()
      options = json.map((v) => v.package.name)
    }
  }, 500)
</script>

<input
  list="npm_search_list"
  type="search"
  bind:value
  on:input={() => getSearchResults()}
/>
<datalist id="npm_search_list">
  {#each options as opt}
    <option value={opt} />
  {/each}
</datalist>
