<script>
  import NpmSearchInput from '../components/NpmSearchInput.svelte'
  import PkgNode from '../components/PkgNode.svelte'
  import Messages from '../components/Messages.svelte'
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
    fetch(`${import.meta.env.VITE_NPM_METADATA_ENDPOINT}/${npmPkgName}`)
      .then((v) => v.json())
      .then((v) => {
        url.replace(`/${npmPkgName}@${v.collected.metadata.version}`)
      })
  }

  let result
  $: if (npmPkgName && npmPkgVersion) {
    const worker = new Worker(new URL('../utils/worker.js', import.meta.url), {
      type: 'module'
    })
    worker.addEventListener('message', (e) => (result = e.data))
    worker.postMessage({
      npmPkgName,
      npmPkgVersion
    })
  }
</script>

{#if npmPkgName && npmPkgVersion}
  <main class="flex flex-col items-center h-full mt-5">
    <h1>
      {npmPkgName} - {npmPkgVersion}
    </h1>
    <NpmSearchInput {npmPkgName} />
    {#if result}
      <section class="w-full max-w-4xl my-4 bg-gray-200 rounded-md">
        <pre class="w-full p-4 m-0 whitespace-normal">
          <ul class="m-0 p-0 list-none">
            <PkgNode value={result.pkgJson} />
          </ul>
        </pre>
      </section>
      <section>
        <Messages messages={result.messages} pkg={result.pkgJson} />
      </section>
    {/if}
  </main>
{/if}

<!-- TODO: Loading screen -->
<style>
</style>
