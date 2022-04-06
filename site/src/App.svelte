<script>
  import HomePage from './pages/Home.svelte'
  import PackagePage from './pages/Package.svelte'
  import { url } from './url'
</script>

{#if $url.pathname === '/'}
  <HomePage />
{:else}
  <PackagePage />
{/if}
