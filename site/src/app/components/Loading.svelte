<script>
  /**
   * @typedef {Object} Props
   * @property {number} [size]
   */

  /** @type {Props} */
  let { size = 80 } = $props()
</script>

<!-- Credits: https://loading.io/css/ -->

<div
  class="lds-dual-ring text-gray-900 @dark:text-gray-100"
  style:--size={size + 'px'}
  style:--border={Math.max(size * 0.075, 1) + 'px'}
></div>

<style>
  .lds-dual-ring {
    display: inline-block;
    width: var(--size);
    height: var(--size);
  }
  .lds-dual-ring:after {
    content: ' ';
    display: block;
    width: 80%;
    height: 80%;
    margin: 10%;
    border-radius: 50%;
    border: var(--border) solid currentColor;
    border-color: currentColor transparent currentColor transparent;
    animation: lds-dual-ring 1.2s linear infinite;
  }
  @keyframes lds-dual-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
