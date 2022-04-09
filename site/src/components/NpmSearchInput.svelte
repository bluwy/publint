<script>
  import { debounce } from '../utils/common'
  import { url } from '../utils/url'

  /**
   * @type {string}
   */
  export let npmPkgName = ''
  /**
   * Input element used to set the value
   * @type {HTMLInputElement | undefined}
   */
  let inputEl
  /**
   * @type {{ value: string, description?: string }[]}
   */
  let options = []
  /**
   * The index of the showed choices when selecting via up/down arrows
   */
  let arrowSelectIndex = -1

  $: hintText =
    arrowSelectIndex < 0 &&
    npmPkgName &&
    options[0] &&
    options[0].value.toLowerCase().startsWith(npmPkgName.toLowerCase())
      ? npmPkgName + options[0].value.slice(npmPkgName.length)
      : ''

  function handleKeyDown(e) {
    if (e.key === 'Tab' && hintText && options[0]) {
      npmPkgName = options[0].value
      // dont tab to another component
      e.preventDefault()
    } else if (e.key === 'Enter' && options[arrowSelectIndex]) {
      // dont submit the form
      e.preventDefault()
    }
  }

  function handleKeyUp(e) {
    if (e.key === 'Enter') {
      if (options[arrowSelectIndex]) {
        npmPkgName = options[arrowSelectIndex].value
      }
      arrowSelectIndex = -1
      return
    }

    if (e.key === 'ArrowUp') {
      arrowSelectIndex--
    } else if (e.key === 'ArrowDown') {
      arrowSelectIndex++
    } else {
      return
    }

    // Clamp index between -1 and options count
    if (arrowSelectIndex < -1) {
      arrowSelectIndex = options.length - 1
    } else if (arrowSelectIndex >= options.length) {
      arrowSelectIndex = -1
    }

    // Set input element value directly so that `value` isn't updated.
    // This will show the preview input value when pre-selecting a choice.
    if (inputEl) {
      if (arrowSelectIndex >= 0) {
        inputEl.value = options[arrowSelectIndex].value
      } else {
        inputEl.value = npmPkgName
      }
    }
  }

  const handleInput = debounce(async () => {
    if (!npmPkgName) return

    const result = await fetch(
      `${import.meta.env.VITE_NPM_SEARCH_ENDPOINT}?q=${npmPkgName}&size=5`,
      {
        method: 'GET'
      }
    )

    if (result.ok) {
      const json = await result.json()
      options = json.map((v) => ({
        value: v.package.name,
        description: v.package.description,
        version: v.package.version
      }))
    }
  }, 500)

  function handleSubmit() {
    if (!npmPkgName) return
    const npmPkgVersion = options.find((o) => o.value === npmPkgName)?.version
    if (npmPkgVersion) {
      url.push(`/${npmPkgName}`)
    } else {
      url.push(`/${npmPkgName}@${npmPkgVersion}`)
    }
  }
</script>

<form
  class="relative isolate w-full max-w-xl group"
  on:submit|preventDefault={handleSubmit}
>
  <div
    class="group-focus-within:block hidden border-rounded-2 w-full overflow-hidden border-none shadow-lg bg-white absolute top-0 -z-1 transition-shadow"
  >
    <!-- Hint for "Tab" -->
    <input
      type="text"
      class="w-full p-4 m-0 text-base bg-transparent text-red pointer-events-none truncate border-none"
      placeholder={hintText}
      readonly
      tabindex="-1"
    />
    {#if options.length}
      <!--
        Set tabindex="-1" to prevent focus going into the list. Instead that can use
        keyboard arrow keys to navigate, while the ARIA labels will fill in the gap.
      -->
      <ul
        class="w-full list-none m-0 p-0 border-0 border-t border-gray"
        tabindex="-1"
        role="tablist"
      >
        {#each options as opt, i}
          <li
            class="m-0 py-0 bg-gray bg-opacity-0 hover:bg-opacity-25 transition-colors sele"
            class:bg-opacity-25={arrowSelectIndex === i}
            aria-selected={arrowSelectIndex === i}
          >
            <button
              class="bg-transparent m-0 border-none text-base w-full block text-left p-4"
              on:click={() => (npmPkgName = opt.value)}
            >
              {opt.value}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <input
    bind:this={inputEl}
    bind:value={npmPkgName}
    class="w-full p-4 m-0 bg-white cursor-pointer focus:outline-none text-base truncate group-focus-within:bg-transparent border-rounded-2 border-none shadow-sm group-focus-within:shadow-none transition-shadow"
    type="text"
    placeholder="Search npm package"
    autocomplete="off"
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
  />
</form>
