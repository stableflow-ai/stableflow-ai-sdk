import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      'stableflow-ai-sdk': resolve(__dirname, '../../dist/index.mjs'),
    },
  },
  define: {
    'process.env': {},
  },
});

