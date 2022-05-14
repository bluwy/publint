<script>
  import Label from '../components/Label.svelte'
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
    if (parts[0] === '') {
      parts.shift()
      parts[0] = '@' + parts[0]
    }
    npmPkgName = parts[0]
    npmPkgVersion = isLocalPkg(npmPkgName) ? '0.0.1' : parts[1]

    // when pkg updates, reset results
    versionFetched = false
    result = undefined
    status = ''
  }

  // Fetch latest version if not specified
  let versionFetched = false
  $: if (npmPkgVersion) {
    versionFetched = true
  } else {
    // prettier-ignore
    fetch(`${import.meta.env.VITE_NPM_METADATA_ENDPOINT}/${encodeURIComponent(npmPkgName)}`)
      .then((v) => v.ok && v.json())
      .then((v) => {
        if (v) {
          url.replace(`/${npmPkgName}@${v.collected.metadata.version}`)
        }
        versionFetched = true
      })
  }

  let result
  let status = ''
  $: if (npmPkgName && npmPkgVersion) {
    const worker = new Worker(new URL('../utils/worker.js', import.meta.url), {
      type: 'module'
    })
    worker.addEventListener('message', (e) => {
      const message = e.data
      if (message.type === 'status') {
        status = message.data
      } else if (message.type === 'result') {
        result = message.data
      }
    })
    worker.postMessage({
      npmPkgName,
      npmPkgVersion
    })
  }

  $: suggestionCount = result?.messages.filter(
    (v) => v.type === 'suggestion'
  ).length
  $: warningCount = result?.messages.filter((v) => v.type === 'warning').length
  $: errorCount = result?.messages.filter((v) => v.type === 'error').length
</script>

<svelte:head>
  {#if npmPkgName && npmPkgVersion}
    <title>{npmPkgName} - {npmPkgVersion} - publint</title>
  {/if}
</svelte:head>

<main class="flex flex-col items-center min-h-screen mt-5">
  {#if npmPkgName && npmPkgVersion}
    <h1>
      {npmPkgName} - {npmPkgVersion}
    </h1>
    <NpmSearchInput {npmPkgName} />
    {#if result}
      <section class="mt-4 flex justify-center items-center gap-4">
        {#if result.messages.length <= 0}
          <Label type="success">All good 🎉</Label>
        {:else}
          {#if suggestionCount}
            <Label type="suggestion">{suggestionCount} suggestions</Label>
          {/if}
          {#if warningCount}
            <Label type="warning">{warningCount} warnings</Label>
          {/if}
          {#if errorCount}
            <Label type="error">{errorCount} errors</Label>
          {/if}
        {/if}
      </section>
      <section
        class="w-full max-w-3xl my-4 bg-gray-200 rounded-md overflow-x-auto overflow-y-hidden"
      >
        <p class="px-4 py-2 m-0 bg-gray-300 font-mono text-sm font-bold">
          package.json
        </p>
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
      <section class="text-center py-8 opacity-70">
        <Loading />
        <p>{status}</p>
      </section>
    {/if}
  {:else if versionFetched}
    <h1>Package does not exist</h1>
    <NpmSearchInput {npmPkgName} />
  {/if}
</main>

<!-- TODO: Loading screen -->
