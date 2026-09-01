import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/analytics': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/search-city': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/farmer': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/weather': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
