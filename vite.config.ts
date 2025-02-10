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
        target: 'http://1.tcp.sa.ngrok.io:20186',
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
