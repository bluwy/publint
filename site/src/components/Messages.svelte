<script>
  import { printMessage } from '../utils/message'

  /** @type {import('publint').Message[]} */
  export let messages
  export let pkg
</script>

<ul class="list-none m-0 p-0">
  {#each messages as message}
    <li class="rounded-md p-4 bg-gray-200">
      {@html printMessage(message, pkg)}
    </li>
  {/each}
</ul>
