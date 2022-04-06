<script>
  import { debounce } from '../utils'

  /**
   * @type {string}
   */
  export let value

  /**
   * Input element used to set the value
   * @type {HTMLInputElement | undefined}
   */
  let inputEl
  /**
   * @type {string[]}
   */
  let options = []
  /**
   * The index of the showed choices when selecting via up/down arrows
   */
  let arrowSelectIndex = -1

  $: hintText =
    arrowSelectIndex < 0 &&
    value &&
    options[0] &&
    options[0].toLowerCase().startsWith(value.toLowerCase())
      ? value + options[0].slice(value.length)
      : ''

  function handleKeyDown(e) {
    if (e.key === 'Tab' && hintText && options[0]) {
      selectChoice(options[0])
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
        selectChoice(options[arrowSelectIndex])
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
        inputEl.value = options[arrowSelectIndex]
      } else {
        inputEl.value = value
      }
    }
  }

  const handleInput = debounce(async () => {
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

<div class="relative">
  <!-- Hint for "Tab" -->
  <input
    type="text"
    class="absolute w-full p-4 text-base bg-transparent text-red pointer-events-none truncate -z-1"
    placeholder={hintText}
    readonly
    tabindex="-1"
  />
  <input
    bind:this={inputEl}
    bind:value
    class="w-full p-4 bg-transparent cursor-pointer focus:outline-none text-base truncate"
    type="text"
    placeholder="npm package"
    autocomplete="off"
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
  />
  {#if options}
    <!--
			Set tabindex="-1" to prevent focus going into the list. Instead that can use
			keyboard arrow keys to navigate, while the ARIA labels will fill in the gap.
		-->
    <ul class="absolute" tabindex="-1" role="tablist">
      {#each options as choice, i}
        <li aria-selected={arrowSelectIndex === i}>
          <button on:click={() => (value = choice)}>
            {choice}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
