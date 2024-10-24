<script>
  import { onDestroy } from 'svelte'
  import githubLogo from '../assets/github.svg'
  import gitlabLogo from '../assets/gitlab.svg'
  import gitLogo from '../assets/git.svg'
  import npmLogo from '../assets/npm.svg'
  import jsdelivrLogo from '../assets/jsdelivr.svg'
  import Header from '../components/Header.svelte'
  import Label from '../components/Label.svelte'
  import Loading from '../components/Loading.svelte'
  import NpmSearchInput from '../components/NpmSearchInput.svelte'
  import PackageVersion from '../components/PackageVersion.svelte'
  import PkgNode from '../components/PkgNode.svelte'
  import { isLocalPkg } from '../utils/common'
  import { url } from '../utils/url'

  let npmPkgName = $state()
  let npmPkgVersion = $state()

  // Fetch latest version if not specified
  let versionFetched = $state(false)

  /** @type {Worker} */
  let worker

  let result = $state()
  let error = $state('')
  let status = $state('')

  onDestroy(() => {
    if (worker) {
      worker.terminate()
    }
  })

  function createWorker() {
    const worker = new Worker(new URL('../utils/worker.js', import.meta.url), {
      type: 'module'
    })

    worker.addEventListener('message', (e) => {
      const message = e.data
      if (message.type === 'status') {
        status = message.data
      } else if (message.type === 'result') {
        result = message.data
      } else if (message.type === 'error') {
        error = message.data
      }
    })
    worker.addEventListener('error', () => {
      error = 'Error processing package'
    })
    return worker
  }

  /**
   * @param {string | Record<string, string> | undefined} repository
   */
  function extractRepoUrl(repository) {
    if (!repository) return

    if (typeof repository === 'string') {
      return extractRepoUrlInternal(repository)
    }
    if (repository.url) {
      return extractRepoUrlInternal(repository.url)
    }
  }
  /**
   * @param {string} url
   */
  function extractRepoUrlInternal(url) {
    url = url
      .replace(/^git\+/, '')
      .replace(/\.git$/, '')
      .replace(/^git:\/\//, 'https://')
    if (url.includes('github.com')) {
      return { logo: githubLogo, url }
    } else if (url.includes('gitlab.com')) {
      return { logo: gitlabLogo, url }
    } else if (url.startsWith('github:')) {
      return { logo: githubLogo, url: `https://github.com/${url.slice(7)}` }
    } else if (url.startsWith('gitlab:')) {
      return { logo: gitlabLogo, url: `https://gitlab.com/${url.slice(7)}` }
    } else if (url.startsWith('bitbucket:')) {
      return { logo: gitLogo, url: `https://bitbucket.org/${url.slice(10)}` }
    } else if (url.split('/').length === 2) {
      return { logo: githubLogo, url: `https://github.com/${url}` }
    } else if (url) {
      return { logo: gitLogo, url }
    }
  }

  $effect(() => {
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
  })

  $effect(() => {
    if (npmPkgVersion) {
      versionFetched = true
    } else {
      fetch(
        // prettier-ignore
        `${import.meta.env.VITE_NPM_REGISTRY}/${encodeURIComponent(npmPkgName)}/latest`
      )
        .then(async (res) => {
          const result = await res.json()
          if (typeof result === 'string') {
            error = result
            return
          }
          if (result?.version) {
            url.replace(`/${npmPkgName}@${result.version}`)
          }
        })
        .finally(() => {
          versionFetched = true
        })
    }
  })

  $effect(() => {
    if (npmPkgName && npmPkgVersion) {
      if (!worker) worker = createWorker()
      error = ''
      status = ''
      worker.postMessage({
        npmPkgName,
        npmPkgVersion
      })
    }
  })

  let suggestionCount = $derived(
    result?.messages.filter((v) => v.type === 'suggestion').length
  )
  let warningCount = $derived(
    result?.messages.filter((v) => v.type === 'warning').length
  )
  let errorCount = $derived(
    result?.messages.filter((v) => v.type === 'error').length
  )

  // Add debug logs for future self
  $effect(() => {
    if (result?.messages) {
      console.debug('publint messages:', $state.snapshot(result).messages)
    }
  })

  let repo = $derived(
    result?.pkgJson?.repository
      ? extractRepoUrl(result?.pkgJson?.repository)
      : undefined
  )
  let npmUrl = $derived(`https://www.npmjs.com/package/${npmPkgName}`)
  let jsdelivrUrl = $derived(
    `https://www.jsdelivr.com/package/npm/${npmPkgName}`
  )
</script>

<svelte:head>
  <!-- prettier-ignore -->
  <title>{npmPkgName} - {npmPkgVersion ? npmPkgVersion + ' - ' : ''} publint</title>
</svelte:head>

<main class="flex flex-col items-center min-h-screen p-4">
  <Header />
  {#if npmPkgName}
    <h1 class="mt-10 mb-0 font-600">
      {npmPkgName}
      {#if !error}
        <PackageVersion version={npmPkgVersion} pkgName={npmPkgName} />
      {/if}
    </h1>
    <p class="flex flex-row justify-center items-end gap-4 mb-10">
      {#if repo}
        <a class="inline-block rounded @light:filter-invert" href={repo.url}>
          <img class="block" src={repo.logo} alt="repo logo" height="20" />
        </a>
      {:else}
        <span class="w-5 h-5"></span>
      {/if}
      <a class="inline-block rounded" href={npmUrl}>
        <img class="block" src={npmLogo} alt="npm logo" height="18" />
      </a>
      <a class="inline-block rounded bg-gray" href={jsdelivrUrl}>
        <img class="block" src={jsdelivrLogo} alt="jsdelivr logo" height="20" />
      </a>
    </p>
    <NpmSearchInput {npmPkgName} />
    {#if result}
      <section class="mt-4 flex justify-center items-center gap-4">
        {#if result.messages.length <= 0}
          <Label type="success">All good 🎉</Label>
        {:else}
          {#if suggestionCount}
            <Label type="suggestion">
              {suggestionCount} suggestion{suggestionCount === 1 ? '' : 's'}
            </Label>
          {/if}
          {#if warningCount}
            <Label type="warning">
              {warningCount} warning{warningCount === 1 ? '' : 's'}
            </Label>
          {/if}
          {#if errorCount}
            <Label type="error">
              {errorCount} error{errorCount === 1 ? '' : 's'}
            </Label>
          {/if}
        {/if}
      </section>
      <section
        class="w-full max-w-3xl my-4 bg-gray-200 @dark:bg-gray-900 rounded-md"
      >
        <p
          class="px-4 py-2 m-0 bg-gray-300 @dark:bg-gray-800 font-mono text-sm font-bold"
        >
          package.json
        </p>
        <pre
          class="relative w-full px-4 py-3 m-0 whitespace-normal text-sm md:text-base overflow-x-auto overflow-y-hidden">
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
        {#if error}
          <p>{error}</p>
        {:else}
          <Loading />
          <p>{status}</p>
        {/if}
      </section>
    {/if}
  {:else if versionFetched}
    <h1>Package not found</h1>
    <NpmSearchInput {npmPkgName} />
  {/if}
</main>
