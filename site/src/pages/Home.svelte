<script>
  import Analysis from '../components/Analysis.svelte'
  import Logo from '../components/Logo.svelte'
  import NpmSearchInput from '../components/NpmSearchInput.svelte'

  /** @type {Record<string, number> | undefined} */
  let analysis

  fetch('/analysis.json')
    .then(async (res) => {
      analysis = await res.json()
    })
    .catch((e) => {
      // best effort. simply log if fail
      console.log(e)
    })
</script>

<svelte:head>
  <title>publint</title>
</svelte:head>

<main class="flex flex-col items-center {analysis ? '' : 'min-h-screen'}">
  <section class="main-section flex flex-col items-center w-full px-4 mb-10">
    <Logo />
    <NpmSearchInput autofocus />
    <p class="my-8">
      <a class="anchor-link" href="#docs">How it works</a>
      <strong class="inline-block mx-1">·</strong>
      <a class="anchor-link" href="/rules.html">Lint rules</a>
      <strong class="inline-block mx-1">·</strong>
      <a class="anchor-link" href="https://github.com/bluwy/publint">GitHub</a>
    </p>
  </section>
  {#if analysis}
    <Analysis results={analysis} />
  {/if}
</main>

<style>
  /*
    try to center the main section with a margin. not using flex center trick since we want the
    Analysis component to also flow naturally pass the page.

    the main section is 280px average (or 17.5rem), but increase to 19rem so the search input is
    slightly higher.
  */
  .main-section {
    margin-top: max(calc((100vh - 19rem) / 2), 2rem);
  }
</style>
