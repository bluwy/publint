/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_NPM_REGISTRY: string
  VITE_NPM_SEARCH_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
