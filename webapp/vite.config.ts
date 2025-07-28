import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars in the current working directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@server/shared': resolve(__dirname, '../server/src/shared-export.ts'),
      },
    },
    server: {
      port: parseInt(env.VITE_CLIENT_PORT) || 13003,
      strictPort: true,
    },
  }
})