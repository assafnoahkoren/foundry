import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars in the current working directory
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      codeInspectorPlugin({
        bundler: 'vite',
        editor: 'cursor', // or 'vscode', 'webstorm', etc.
        showSwitch: true, // Show the floating switch button
        hotKeys: ['ctrlKey', 'shiftKey'], // Default: ctrl+shift+c (cmd+shift+c on Mac)
      })
    ],
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