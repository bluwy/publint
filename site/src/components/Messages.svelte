<script>
  import { printMessage } from '../utils/message'

  /** @type {import('publint').Message[]} */
  export let messages
  export let pkg
</script>

<ul>
  {#each messages as message}
    {@html printMessage(message, pkg)}
  {/each}
</ul>
