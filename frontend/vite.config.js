import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://tinkstudio.it',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
