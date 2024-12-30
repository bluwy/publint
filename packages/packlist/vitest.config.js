import { defineConfig } from 'vitest/config'

process.stdin.isTTY = false
process.stdout.isTTY = false

export default defineConfig({
  test: {
    include: ['tests/*.test.js'],
    isolate: false
  }
})
