<script>
  export let key = ''
  export let value = undefined
  export let comma = false

  $: isValueArray = Array.isArray(value)
  $: isValueObject = value && typeof value === 'object'
  $: keyText = key ? `"${key}": ` : ''
</script>

<li class="flex flex-col py-1">
  {#if isValueObject}
    <span>{keyText}{isValueArray ? '[' : '{'}</span>
    <ul class="m-0 p-0 list-none pl-[2ch]">
      {#each Object.entries(value) as [k, v], i}
        <svelte:self
          key={isValueArray ? '' : k}
          value={v}
          comma={i + 1 < Object.keys(value).length}
        />
      {/each}
    </ul>
    <span class="m-0">{isValueArray ? ']' : '}'}</span>
  {:else}
    <span class="inline-flex">
      <span class="mr-[1ch]">{keyText}</span>
      <span class="token {typeof value}">
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
