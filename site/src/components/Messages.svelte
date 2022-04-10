<script>
  import { errorNodePositions } from '../stores/errors'
  import { printMessage } from '../utils/message'

  /** @type {import('publint').Message[]} */
  export let messages
  export let pkg
</script>

<ul class="relative list-none m-0 p-0">
  {#each messages as message}
    {@const offset = $errorNodePositions.get(message.path) ?? 0}
    <!-- TODO: Grouping -->
    <li
      class="absolute rounded-md w-full px-4 py-2 bg-red-200"
      style="top: {offset}px"
    >
      {@html printMessage(message, pkg)}
    </li>
  {/each}
</ul>
