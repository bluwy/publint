import cp from 'node:child_process'
import util from 'node:util'
import { afterAll, beforeAll } from 'vitest'

const exec = util.promisify(cp.exec)
const cwd = new URL('./', import.meta.url)

export async function isBunInstalled() {
  try {
    await exec('bun -v', { cwd })
    return true
  } catch {
    return false
  }
}

export async function setupCorepackAndTestHooks() {
  const isCorepackEnabled = process.env.COREPACK_ROOT !== undefined
  const isCorepackNpmEnabled =
    isCorepackEnabled && (await checkCorepackNpmEnabled())

  // If corepack is disabled globally, we temporarily enable it + npm, and then
  // disable it after all tests have run.
  if (!isCorepackEnabled) {
    beforeAll(async () => {
      console.info(
        'Corepack not enabled for `@publint/packlist` tests. Enabling.'
      )
      await exec('corepack enable', { cwd })
      await exec('corepack enable npm', { cwd })
    })
    afterAll(async () => {
      console.info('Disabling corepack for `@publint/packlist` tests.')
      await exec('corepack disable', { cwd })
      await exec('corepack disable npm', { cwd })
    })
  }
  // If corepack is enabled, but its npm support is not, we temporarily enable it,
  // and then disable it after all tests have run.
  else if (!isCorepackNpmEnabled) {
    beforeAll(async () => {
      console.info(
        'Corepack npm support not enabled for `@publint/packlist` tests. Enabling.'
      )
      await exec('corepack enable npm', { cwd })
    })
    afterAll(async () => {
      console.info(
        'Disabling corepack npm support for `@publint/packlist` tests.'
      )
      await exec('corepack disable npm', { cwd })
    })
  }
}

async function checkCorepackNpmEnabled() {
  // If corepack npm is enabled (which is disabled by default unless with `corepack enable npm`),
  // then calling `npm -v` here should error out because this project is configured with pnpm.
  try {
    await exec('npm -v', { cwd: new URL('./', import.meta.url) })
    return false
  } catch {
    return true
  }
}
