/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_LANGGRAPH_API_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BASE_URL_2: string
  readonly VITE_LANGGRAPH_API_URL_2: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
