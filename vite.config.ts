import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 8081,
    proxy: {
      '/consulta': {
        target: 'https://xyz-123-456.ngrok.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/consulta/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})
