<script>
  import { messageTypeToColor } from '../utils/colors'

  /**
   * @typedef {Object} Props
   * @property {'error' | 'warning' | 'suggestion' | 'success'} type
   * @property {import('svelte').Snippet} children
   */

  /** @type {Props} */
  let { type, children } = $props()

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
  onclick={handleClick}
>
  {@render children?.()}
</button>
