<script context="module">
  const KEY = {}
</script>

<script>
  import { getContext, setContext } from 'svelte'
  import { isArrayEqual } from '../utils/common'
  import { printMessage } from '../utils/message'

  export let key = ''
  export let value = undefined
  export let comma = false
  export let indent = 0
  export let messages
  export let pkg

  const paths = key ? getContext(KEY).concat(key) : []
  setContext(KEY, paths)

  $: isValueArray = Array.isArray(value)
  $: isValueObject = value && typeof value === 'object'
  $: keyText = key ? `"${key}": ` : ''

  $: errorMessages = messages.filter((v) => isArrayEqual(paths, v.path))

  function messageTypeToColor(type) {
    switch (type) {
      case 'error':
        return 'border-red-400 bg-red-300'
      case 'warning':
        return 'border-yellow-400 bg-yellow-300'
      case 'suggestion':
        return 'border-blue-400 bg-blue-300'
      default:
        return ''
    }
  }
</script>

<li
  class="relative isolate flex flex-col pt-1"
  style:--indent-ch="{indent * 2}ch"
>
  {#if isValueObject}
    <!-- TODO: Truncate known unnecessary fields -->
    <span class="indentable">{keyText}{isValueArray ? '[' : '{'}</span>
    <ul class="m-0 p-0 list-none">
      {#each Object.entries(value) as [k, v], i}
        <svelte:self
          key={isValueArray ? '' : k}
          value={v}
          comma={i + 1 < Object.keys(value).length}
          indent={indent + 1}
          {messages}
          {pkg}
        />
      {/each}
    </ul>
    <span class="indentable m-0"
      >{isValueArray ? ']' : '}'}{comma ? ',' : ''}</span
    >
  {:else}
    <span class="indentable inline-flex">
      <span class="mr-[1ch]">{keyText}</span>
      <span class="whitespace-nowrap token {typeof value}">
        {JSON.stringify(value)}
      </span>
      {comma ? ',' : ''}
    </span>
  {/if}
  {#if errorMessages.length}
    <div
      class="absolute flex items-start justify-end left-0 right-0 top-0 h-full bg-gray-300 pt-1 px-1 -z-1 -mx-4"
    />
    <div class="-mx-4">
      {#each errorMessages as msg}
        <div class="{messageTypeToColor(msg.type)} border-4 px-4 py-2">
          {@html printMessage(msg, pkg)}
        </div>
      {/each}
    </div>
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

  .indentable {
    margin-left: var(--indent-ch);
  }
</style>