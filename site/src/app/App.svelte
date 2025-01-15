<script>
  import HomePage from './pages/Home.svelte'
  import PackagePage from './pages/Package.svelte'
  import { url } from './utils/url'
  import { listenUrlClick } from './utils/url-click'

  listenUrlClick()
</script>

{#if $url.pathname === '/'}
  <HomePage />
{:else}
  <PackagePage />
{/if}
