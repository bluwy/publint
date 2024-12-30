import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/*.test.js'],
    fileParallelism: false,
    isolate: false,
    pool: 'threads'
  }
})
