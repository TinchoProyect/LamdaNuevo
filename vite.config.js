import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                },
            },
        },
    },
    // Configuración específica para el manejo de assets
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.svg'],
    base: '/', // Asegura que las rutas sean relativas a la raíz
    server: {
        port: 3001,
    },
});
