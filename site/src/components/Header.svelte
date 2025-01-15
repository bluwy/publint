<script>
  import homeIcon from '../assets/home.svg'
  import githubIcon from '../assets/github.svg'

  /**
   * @typedef {Object} Props
   * @property {boolean} [fixedInXl]
   */

  /** @type {Props} */
  let { fixedInXl = false } = $props()
</script>

<header
  class="absolute top-0 left-0 w-full z-10 px-4 pointer-events-none {fixedInXl
    ? 'xl:fixed'
    : ''}"
>
  <nav class="bookmark-nav flex gap-4 justify-end max-w-3xl mx-auto">
    <a
      class="bookmark decoration-none pointer-events-auto"
      href="/"
      title="Go to main page"
    >
      <img src={homeIcon.src} alt="home icon" width="20" height="20" />
    </a>
    <a
      class="bookmark decoration-none pointer-events-auto"
      href="https://github.com/publint/publint"
      title="Go to GitHub repo"
    >
      <img src={githubIcon.src} alt="github logo" width="20" height="20" />
    </a>
  </nav>
</header>
