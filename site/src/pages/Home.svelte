<script>
  import NpmSearchInput from '../components/NpmSearchInput.svelte'
</script>

<svelte:head>
  <title>publint</title>
</svelte:head>

<main class="flex flex-col justify-center items-center h-screen mt-5s">
  <h1 class="mb-0">publint</h1>
  <p>Lint before you publish!</p>
  <section class="flex flex-col justify-center items-center w-full">
    <NpmSearchInput />
  </section>
</main>
