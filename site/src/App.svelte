<script>
  import NpmSearchInput from './components/NpmSearchInput.svelte'

  let npmPkgName = ''

  async function handleSubmit() {
    const result = await fetch(
      `${
        import.meta.env.VITE_NPM_REGISTRY
      }/${npmPkgName}/-/${npmPkgName}-${'1.0.0'}.tgz`
    )
    console.log(result)
  }
</script>

<main class="flex flex-col justify-center items-center h-full">
  <form
    class="flex flex-col justify-center items-center w-full"
    on:submit|preventDefault={handleSubmit}
  >
    <NpmSearchInput bind:value={npmPkgName} />
    <button>Search</button>
  </form>
</main>
