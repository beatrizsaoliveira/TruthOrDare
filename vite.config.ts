import { defineConfig } from 'vite';

// Set BASE_URL env var to your GitHub repo sub-path when deploying to
// https://beatrizsaoliveira.github.io/TruthOrDare/  →  BASE_URL=/TruthOrDare/
// (already set in .github/workflows/deploy.yml)
export default defineConfig({
  base: process.env['BASE_URL'] ?? '/',
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
