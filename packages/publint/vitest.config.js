import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/*.test.js'],
    isolate: false,
    slowTestThreshold: 600,
    // This is needed so that test files use a single instance of `fs-fixture` and
    // it won't generate the same conflicting directory names among test files.
    fileParallelism: false,
  },
})
