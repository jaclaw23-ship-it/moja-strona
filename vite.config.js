import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://n8n.nocodecj.pl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, ''),
      },
    },
  },
})
