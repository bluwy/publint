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
    arrowSelectIndex = -1

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
      url.push(`/${npmPkgName}@${npmPkgVersion}`)
    } else {
      url.push(`/${npmPkgName}`)
    }
    document.body.focus()
    getSelection()?.removeAllRanges()
    // Clear options so it looks natural that an action has taken place
    options = []
  }

  /**
   * @param {string} text
   * @param {string} query
   */
  function highlightText(text, query) {
    return text.replace(query, (match) => `<strong>${match}</strong>`)
  }
</script>

<form
  class="relative isolate w-full max-w-xl group z-50"
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
              class="bg-transparent flex justify-between m-0 border-none text-base w-full block text-left p-4"
              on:click={() => (npmPkgName = opt.value)}
            >
              <span>{@html highlightText(opt.value, npmPkgName)}</span>
              <span class="opacity-50">{opt.version}</span>
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
  <button
    class="absolute flex flex justify-center items-center top-0 right-0 h-full bg-transparent border-none px-4"
  >
    <!-- https://css.gg/search -->
    <!-- prettier-ignore -->
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.319 14.4326C20.7628 11.2941 20.542 6.75347 17.6569 3.86829C14.5327 0.744098 9.46734 0.744098 6.34315 3.86829C3.21895 6.99249 3.21895 12.0578 6.34315 15.182C9.22833 18.0672 13.769 18.2879 16.9075 15.8442C16.921 15.8595 16.9351 15.8745 16.9497 15.8891L21.1924 20.1317C21.5829 20.5223 22.2161 20.5223 22.6066 20.1317C22.9971 19.7412 22.9971 19.1081 22.6066 18.7175L18.364 14.4749C18.3493 14.4603 18.3343 14.4462 18.319 14.4326ZM16.2426 5.28251C18.5858 7.62565 18.5858 11.4246 16.2426 13.7678C13.8995 16.1109 10.1005 16.1109 7.75736 13.7678C5.41421 11.4246 5.41421 7.62565 7.75736 5.28251C10.1005 2.93936 13.8995 2.93936 16.2426 5.28251Z" fill="currentColor" /></svg>
  </button>
</form>
