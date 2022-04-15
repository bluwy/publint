<script>
  import Loading from '../components/Loading.svelte'
  import NpmSearchInput from '../components/NpmSearchInput.svelte'
  import PkgNode from '../components/PkgNode.svelte'
  import { isLocalPkg } from '../utils/common'
  import { url } from '../utils/url'

  let npmPkgName, npmPkgVersion
  $: {
    // $url.pathname possible values:
    // /foo
    // /foo@1.0.0
    // /@foo/bar@1.0.0
    const parts = $url.pathname.slice(1).split('@')
    if (parts[0] === '') parts.shift()
    npmPkgName = parts[0]
    npmPkgVersion = isLocalPkg(npmPkgName) ? '0.0.1' : parts[1]
  }

  // Fetch latest version if not specified
  $: if (!npmPkgVersion) {
    // fetch(`${import.meta.env.VITE_NPM_METADATA_ENDPOINT}/${npmPkgName}`)
    //   .then((v) => v.json())
    //   .then((v) => {
    //     url.replace(`/${npmPkgName}@${v.collected.metadata.version}`)
    //   })
  }

  let result
  $: if (npmPkgName && npmPkgVersion) {
    // const worker = new Worker(new URL('../utils/worker.js', import.meta.url), {
    //   type: 'module'
    // })
    // worker.addEventListener('message', (e) => (result = e.data))
    // worker.postMessage({
    //   npmPkgName,
    //   npmPkgVersion
    // })
  }
</script>

<svelte:head>
  <title>{npmPkgName} - {npmPkgVersion} - publint</title>
</svelte:head>

<main class="flex flex-col items-center min-h-screen mt-5">
  {#if npmPkgName && npmPkgVersion}
    <h1>
      {npmPkgName} - {npmPkgVersion}
    </h1>
    <NpmSearchInput {npmPkgName} />
    {#if result}
      <section
        class="w-full max-w-3xl my-4 bg-gray-200 rounded-md overflow-x-auto overflow-y-hidden"
      >
        <pre
          class="relative w-full px-4 py-3 m-0 whitespace-normal text-sm md:text-base">
          <ul class="m-0 p-0 list-none">
            <PkgNode
              value={result.pkgJson}
              messages={result.messages}
              pkg={result.pkgJson}
            />
          </ul>
        </pre>
      </section>
    {:else}
      <section class="text-center py-8">
        <Loading />
        <p>Linting package...</p>
      </section>
    {/if}
  {/if}
</main>

<!-- TODO: Loading screen -->
