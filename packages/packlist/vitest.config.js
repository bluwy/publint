import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/*.test.js'],
    testTimeout: process.env.CI ? 10000 : undefined,
    isolate: false
  }
})
