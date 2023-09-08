<script>
  import { messageTypeToColor } from '../utils/colors'

  export let type

  function handleClick() {
    const el = document.querySelector(`.message-type-${type}`)
    el?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<button
  class="
    inline text-base leading-tight border-none px-2 py-1 rounded-lg
    {messageTypeToColor(type)}
  "
  on:click={handleClick}
>
  <slot />
</button>
