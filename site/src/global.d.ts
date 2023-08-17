/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_NPM_REGISTRY: string
  VITE_JSDELIVR_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
