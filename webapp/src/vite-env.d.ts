/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT_PORT: string
  readonly VITE_SERVER_URL: string
  readonly VITE_CLIENT_URL: string
  readonly VITE_APP_NAME: string
  // Add more VITE_ prefixed env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
