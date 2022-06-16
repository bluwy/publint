<script>
  import Logo from '../components/Logo.svelte'
  import NpmSearchInput from '../components/NpmSearchInput.svelte'
</script>

<svelte:head>
  <title>publint</title>
</svelte:head>

<main class="flex flex-col justify-center items-center h-screen mt-5 p-4">
  <section class="relative flex flex-col justify-center items-center w-full">
    <div class="absolute bottom-full text-center">
      <Logo />
    </div>
    <NpmSearchInput autofocus />
    <a class="anchor-link opacity-60 my-8" href="#docs">How it works?</a>
  </section>
</main>
