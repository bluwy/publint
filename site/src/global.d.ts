/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_NPM_REGISTRY: string
  VITE_JSDELIVR_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'on:clickoutside'?: (event: MouseEvent) => any
  }
}
