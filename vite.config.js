import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/backend': {
        target: 'https://mits-cms.freedev.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
