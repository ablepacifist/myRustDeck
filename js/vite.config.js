import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        manifest: false,
        rollupOptions: {
            output: {
                entryFileNames: `[name].[hash].js`,
                chunkFileNames: `[name].[hash].js`,
                assetFileNames: `[name].[ext]`,
            }
        }
    },
})