import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  plugins: [react()],
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../shared')
      ]
    },
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
