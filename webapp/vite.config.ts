import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ConfigService } from '@foundry/shared'

const config = ConfigService.getInstance()
const clientPort = config.get('client').port

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: clientPort,
    strictPort: true,
  },
})