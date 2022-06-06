<script>
  import { messageTypeToColor } from '../utils/colors'
  export let type
</script>

<span
  class="border-2 px-2 py-1 rounded-lg text-black {messageTypeToColor(type)}"
>
  <slot />
</span>
