<script>
  import { messageTypeToColor } from '../utils/colors'
  export let type
  
  /**
   * @description Handle click on label 
   */
  function handleLabelClick() {
    const el = document.querySelector(`.${type}`)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

</script>

<span
  role="button"
  tabindex="0"
  on:click={handleLabelClick}
  on:keydown={(event) => {
    if (event.key === 'Enter') {
      handleLabelClick();
      event.preventDefault();
    }
  }}
  class="border-2 px-2 py-1 rounded-lg {messageTypeToColor(type)}"
>
  <slot />
</span>
