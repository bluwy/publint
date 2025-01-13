<script module>
  const KEY = {}
</script>

<script>
  import PkgNode from './PkgNode.svelte'
  import { getContext, setContext } from 'svelte'
  import { messageTypeToColor } from '../utils/colors'
  import { isArrayEqual } from '../utils/common'
  import { formatMessage } from '../utils/message'

  /**
   * @typedef {Object} Props
   * @property {string | number} [key]
   * @property {any} [value]
   * @property {boolean} [comma]
   * @property {number} [indent]
   * @property {any} messages
   * @property {any} pkg
   */

  /** @type {Props} */
  let {
    key = '',
    value = undefined,
    comma = false,
    indent = 0,
    messages,
    pkg,
  } = $props()

  const paths = key ? getContext(KEY).concat(key) : []
  setContext(KEY, paths)

  let isValueArray = $derived(Array.isArray(value))
  let isValueObject = $derived(value && typeof value === 'object')
  let keyText = $derived(key && isNaN(parseInt(`${key}`)) ? `"${key}": ` : '')

  let matchedMessages = $derived(
    messages.filter((v) => v.path.length && isArrayEqual(paths, v.path)),
  )

  const maxShownMessages = 5
  let showAllMessages = $state(false)
  let shownMessages = $derived(
    showAllMessages
      ? matchedMessages
      : matchedMessages.slice(0, maxShownMessages),
  )
</script>

<li
  class="relative isolate flex flex-col pt-1"
  style:--indent-ch="{indent * 2}ch"
>
  {#if isValueObject}
    <!-- TODO: Truncate known unnecessary fields -->
    <span class="indentable">
      <span class="text-blue-700 @dark:text-blue-300">{keyText}</span>
      {isValueArray ? '[' : '{'}
    </span>
    <ul class="m-0 p-0 list-none">
      {#each Object.entries(value) as [k, v], i}
        <PkgNode
          key={k}
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
      <span class="key mr-[1ch] min-w-max">{keyText}</span>
      <span class="whitespace-nowrap token {typeof value}">
        {JSON.stringify(value)}
      </span>
      {comma ? ',' : ''}
    </span>
  {/if}
  {#if shownMessages.length}
    <div
      class="absolute flex items-start justify-end left-0 right-0 top-0 h-full bg-gray-300 @dark:bg-gray-700 pt-1 px-1 -z-1 -mx-4"
    ></div>
    <div class="-mx-4">
      {#each shownMessages as msg}
        <div
          class="
            {messageTypeToColor(msg.type)}
            message message-type-{msg.type} border-solid border-4 px-4 py-2 scroll-mt-8
          "
        >
          {@html formatMessage(msg, pkg)}
        </div>
      {/each}
      {#if shownMessages.length < matchedMessages.length && !showAllMessages}
        <button
          class="w-full px-4 py-2 text-xs bg-gray-400 @dark:bg-gray-600 hover:bg-gray-500 focus:bg-gray-500 focus:outline-none border-0"
          onclick={() => (showAllMessages = true)}
        >
          Show {matchedMessages.length - shownMessages.length} more
        </button>
      {/if}
    </div>
  {/if}
</li>

<style>
  /* NOTE: these styles must match shiki in the rules page */

  .key {
    color: #0451a5;
  }

  .token {
    color: black;
  }

  .token.string {
    color: #a31515;
  }

  .token.number {
    color: #098658;
  }

  .token.boolean {
    color: #0000ff;
  }

  .indentable {
    margin-left: var(--indent-ch);
  }

  .message ~ .message {
    border-top: 0;
  }

  @media (prefers-color-scheme: dark) {
    .key {
      color: #9cdcfe;
    }

    .token {
      color: white;
    }

    .token.string {
      color: #ce9178;
    }

    .token.number {
      color: #b5cea8;
    }

    .token.boolean {
      color: #569cd6;
    }
  }
</style>
