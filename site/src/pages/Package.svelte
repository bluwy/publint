<script>
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
    npmPkgVersion = parts[1]
  }

  // Fetch latest version if not specified
  $: if (!npmPkgVersion) {
    fetch(`${import.meta.env.VITE_NPM_SEARCH_ENDPOINT}/v2/package${npmPkgName}`)
      .then((v) => v.json())
      .then((v) => {
        npmPkgVersion = v.metadata.version
      })
  }

  $: if (npmPkgName && npmPkgVersion) {
    const worker = new Worker(new URL('../utils/worker.js', import.meta.url), {
      type: 'module'
    })
    worker.addEventListener('message', (e) => {
      console.log(e.data)
    })
    worker.postMessage({
      npmPkgName,
      npmPkgVersion
    })
  }
</script>

{npmPkgName} - {npmPkgVersion}
