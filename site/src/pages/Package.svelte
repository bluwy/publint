<script>
  import { url } from '../utils/url'

  let npmPkgName
  let npmPkgVersion

  $: {
    ;[npmPkgName, npmPkgVersion] = $url.pathname.slice(1).split('@')

    if (!npmPkgVersion) {
      // TODO: Fetch latest version
      npmPkgVersion = '1.0.0'
    }

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
