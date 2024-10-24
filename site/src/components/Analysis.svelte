<script>
  import severitySuccess from '../assets/severity-success.svg'
  import severityInfo from '../assets/severity-info.svg'
  import severityWarning from '../assets/severity-warning.svg'
  import severityError from '../assets/severity-error.svg'

  /**
   * @typedef {Object} Props
   * @property {Record<string, number>} results
   */

  /** @type {Props} */
  let { results } = $props()

  let open = $state(false)

  /**
   * @param {number} num
   */
  function numberToSeveritySrc(num) {
    switch (num) {
      case 0:
        return severitySuccess
      case 1:
        return severityInfo
      case 2:
        return severityWarning
      case 3:
        return severityError
    }
  }

  /**
   * @param {number} num
   */
  function numberToSeverityText(num) {
    switch (num) {
      case 0:
        return 'severity success'
      case 1:
        return 'severity info'
      case 2:
        return 'severity warning'
      case 3:
        return 'severity error'
    }
  }

  /**
   * @param {number} num
   */
  function numberToClass(num) {
    switch (num) {
      case 0:
        return 'border-green-200 bg-green-100 @dark:border-green-700 @dark:bg-green-900 hover:bg-green-200 focus:bg-green-200 @dark:hover:bg-green-800 @dark:focus:bg-green-800'
      case 1:
        return 'border-blue-200 bg-blue-100 @dark:border-blue-700 @dark:bg-blue-900 hover:bg-blue-200 focus:bg-blue-200 @dark:hover:bg-blue-800 @dark:focus:bg-blue-800'
      case 2:
        return 'border-yellow-200 bg-yellow-100 @dark:border-yellow-700 @dark:bg-yellow-900 hover:bg-yellow-200 focus:bg-yellow-200 @dark:hover:bg-yellow-800 @dark:focus:bg-yellow-800'
      case 3:
        return 'border-red-200 bg-red-100 @dark:border-red-700 @dark:bg-red-900 hover:bg-red-200 focus:bg-red-200 @dark:hover:bg-red-800 @dark:focus:bg-red-800'
    }
  }

  /**
   * Given `foo@1.2.3` or `@foo/bar@1.2.3`, return `foo` or `@foo/bar`.
   * @param {string} str
   */
  function getPackageName(str) {
    const lastAtIndex = str.lastIndexOf('@')
    if (lastAtIndex === -1 || lastAtIndex === 0) return str
    return str.slice(0, lastAtIndex)
  }
</script>

<div class="relative w-full mt-16">
  <h2 class="text-center font-medium text-xl">Popular packages</h2>

  <div
    class="flex justify-center items-center flex-wrap gap-4 max-w-300 mx-auto transition-height {open
      ? 'mb-16'
      : 'h-50 overflow-y-hidden'}"
  >
    {#each Object.entries(results) as [key, value]}
      <a
        class="analysis-block inline-block items-center gap-1 w-60 p-2 rounded-md border-2 border-solid decoration-none text-ellipsis whitespace-nowrap overflow-x-hidden transition-background-color {numberToClass(
          value
        )}"
        href="/{key}"
      >
        <img
          class="inline-block h-5 mr-0.75 align-middle"
          src={numberToSeveritySrc(value)}
          alt={numberToSeverityText(value)}
        />
        <span class="opacity-90 align-middle">{getPackageName(key)}</span>
      </a>
    {/each}
  </div>

  <!-- fade shadow -->
  {#if !open}
    <div
      class="absolute bottom-0 w-full h-32 bg-gradient-to-b from-transparent to-gray-300 @dark:to-gray-800 pointer-events-none"
    ></div>
    <div
      class="blur-mask absolute bottom-0 w-full h-28 backdrop-blur pointer-events-none"
    ></div>
    <div
      class="absolute flex justify-center items-center bottom-0 w-full h-16 pointer-events-none"
    >
      <button
        class="action-button pointer-events-initial"
        onclick={() => (open = true)}
      >
        View all {Object.keys(results).length} packages
      </button>
    </div>
  {/if}
</div>

<style>
  /*
    Make sure on smallest screens, we can still fit two blocks per row.
    The gap between two blocks and the screen edge should be 1rem.
  */
  .analysis-block {
    max-width: calc((100vw - 3rem) / 2);
  }

  .blur-mask {
    -webkit-mask: linear-gradient(transparent, black 60%);
    mask: linear-gradient(transparent, black 60%);
  }
</style>
