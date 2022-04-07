<script>
  import NpmSearchInput from '../components/NpmSearchInput.svelte'
  import { url } from '../utils/url'

  let npmPkgName = ''
</script>

<main class="flex flex-col items-center h-full mt-5">
  <h1 class="mb-0">publint</h1>
  <p>Lint before you publish!</p>
  <form
    class="flex flex-col justify-center items-center w-full"
    on:submit|preventDefault={() => url.push('/' + npmPkgName)}
  >
    <NpmSearchInput bind:value={npmPkgName} />
  </form>
</main>
