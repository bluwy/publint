<script>
  import HomePage from './pages/Home.svelte'
  import PackagePage from './pages/Package.svelte'
  import { url } from './utils/url'
</script>

{#if $url.pathname === '/'}
  <HomePage />
{:else}
  <PackagePage />
{/if}
