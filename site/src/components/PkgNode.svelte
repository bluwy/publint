<script context="module">
  const KEY = {}
</script>

<script>
  import { getContext, setContext } from 'svelte'
  import { errorNodePositions } from '../stores/errors'
  import { isArrayEqual } from '../utils/common'

  export let key = ''
  export let value = undefined
  export let comma = false
  export let messagePaths

  const paths = key ? getContext(KEY).concat(key) : []
  setContext(KEY, paths)

  $: isValueArray = Array.isArray(value)
  $: isValueObject = value && typeof value === 'object'
  $: keyText = key ? `"${key}": ` : ''

  $: errorPath = messagePaths.find((v) => isArrayEqual(paths, v))
  $: isError = !!errorPath

  /** @type {HTMLLIElement} */
  let li
  $: if (isError && li) {
    $errorNodePositions.set(errorPath, li.offsetTop)
  }
</script>

<li bind:this={li} class="isolate flex flex-col py-1">
  {#if isError}
    <div
      class="absolute flex items-center justify-end left-0 w-full bg-red-200 text-red-700 p-1 -z-1 -translate-y-1"
    >
      <!-- prettier-ignore -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6C12.5523 6 13 6.44772 13 7V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V7C11 6.44772 11.4477 6 12 6Z" fill="currentColor" /><path d="M12 16C11.4477 16 11 16.4477 11 17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17C13 16.4477 12.5523 16 12 16Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12Z" fill="currentColor" /></svg>
    </div>
  {/if}
  {#if isValueObject}
    <span>{keyText}{isValueArray ? '[' : '{'}</span>
    <ul class="m-0 p-0 list-none pl-[2ch]">
      {#each Object.entries(value) as [k, v], i}
        <svelte:self
          key={isValueArray ? '' : k}
          value={v}
          comma={i + 1 < Object.keys(value).length}
          {messagePaths}
        />
      {/each}
    </ul>
    <span class="m-0">{isValueArray ? ']' : '}'}</span>
  {:else}
    <span class="inline-flex">
      <span class="mr-[1ch]">{keyText}</span>
      <span class="whitespace-nowrap token {typeof value}">
        {JSON.stringify(value)}
      </span>
      {comma ? ',' : ''}
    </span>
  {/if}
</li>

<style>
  .token {
    color: black;
  }

  .token.string {
    color: brown;
  }

  .token.number {
    color: yellow;
  }

  .token.boolean {
    color: blue;
  }
</style>
