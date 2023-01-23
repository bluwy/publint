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
    <p class="my-8 opacity-60">
      <a class="anchor-link" href="#docs">How it works</a>
      <strong class="inline-block mx-1">-</strong>
      <a class="anchor-link" href="/rules.html">Rules</a>
    </p>
  </section>
</main>
