import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/*.test.js'],
    isolate: false,
    slowTestThreshold: 600,
  },
})
