<script>
  import homeIcon from '../assets/home.svg'
  import githubIcon from '../assets/github.svg'
</script>

<header class="absolute xl:fixed top-0 left-0 w-full z-10 px-4">
  <nav class="bookmark-nav flex gap-4 justify-end max-w-3xl mx-auto">
    <a class="bookmark decoration-none" href="/" title="Go to main page">
      <img src={homeIcon.src} alt="home icon" width="20" height="20" />
    </a>
    <a
      class="bookmark decoration-none"
      href="https://github.com/publint/publint"
      title="Go to GitHub repo"
    >
      <img src={githubIcon.src} alt="github logo" width="20" height="20" />
    </a>
  </nav>
</header>
