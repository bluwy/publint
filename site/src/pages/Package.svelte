<script>
  async function handleSubmit() {
    const result = await fetch(
      `${
        import.meta.env.VITE_NPM_REGISTRY
      }/${npmPkgName}/-/${npmPkgName}-${'1.0.0'}.tgz`
    )
    console.log(result)
  }
</script>

Hello
