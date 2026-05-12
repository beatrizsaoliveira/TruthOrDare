import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Set BASE_URL env var to your GitHub repo sub-path when deploying to
// https://beatrizsaoliveira.github.io/TruthOrDare/  →  BASE_URL=/TruthOrDare/
// (already set in .github/workflows/deploy.yml)
export default defineConfig({
    base: process.env['BASE_URL'] ?? '/',
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'favicon.svg',
                'apple-touch-icon-180x180.png',
                'pwa-512.svg',
            ],
            manifest: {
                name: 'Verdade ou Desafio',
                short_name: 'VouD',
                description:
                    'Jogo social em português europeu, do familiar ao extremo. 4 níveis de intensidade.',
                theme_color: '#7C3AED',
                background_color: '#0f0f1a',
                display: 'standalone',
                orientation: 'portrait',
                lang: 'pt-PT',
                icons: [
                    {
                        src: 'pwa-64x64.png',
                        sizes: '64x64',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,json,svg,png,ico,webp}'],
            },
        }),
    ],
    build: {
        outDir: 'dist',
        minify: 'esbuild',
        target: 'es2020',
        cssMinify: true,
        rollupOptions: {
            output: {
                // Single JS bundle — no code-splitting needed for this app size
                manualChunks: undefined,
            },
        },
    },
    server: {
        open: true,
    },
});
