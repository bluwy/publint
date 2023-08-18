<script>
  import homeIcon from '../assets/home.svg'
  import githubIcon from '../assets/github.svg'
</script>

<!-- NOTE: this is copied from rules.html -->
<header class="absolute top-0 left-0 w-full z-10">
  <nav class="bookmark-nav flex gap-4 justify-end max-w-3xl mx-auto">
    <a class="bookmark decoration-none" href="/" title="Go to main page">
      <img src={homeIcon} alt="home icon" width="20" height="20" />
    </a>
    <a
      class="bookmark decoration-none"
      href="https://github.com/bluwy/publint"
      title="Go to GitHub repo"
    >
      <img src={githubIcon} alt="github logo" width="20" height="20" />
    </a>
  </nav>
</header>
