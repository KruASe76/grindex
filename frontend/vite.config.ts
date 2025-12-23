/// <reference types="vitest" />
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, './src/app'),
            '@features': path.resolve(__dirname, './src/features'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@components': path.resolve(__dirname, './src/components'),
            '@config': path.resolve(__dirname, './src/config.ts'),
        },
    },

    // @ts-expect-error - vitest types are not automatically picked up in vite config
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    },
})
