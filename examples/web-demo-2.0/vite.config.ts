import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process", "stream", "util"],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      'stableflow-ai-sdk': resolve(__dirname, '../../dist/index.mjs'),
      buffer: 'buffer',
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ["buffer", "process", "stream", "util", "near-api-js"],
  },
});

