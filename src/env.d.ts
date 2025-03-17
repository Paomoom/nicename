/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COZE_API_KEY: string
  readonly VITE_COZE_BOT_ID: string
  readonly VITE_COZE_USER_ID: string
  readonly VITE_COZE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 