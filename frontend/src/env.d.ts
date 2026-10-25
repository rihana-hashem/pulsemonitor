/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin for browser requests; empty means same origin. See .env.example. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
