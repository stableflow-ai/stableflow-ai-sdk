import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
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
    "process.browser": "true",
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ["buffer", "process", "stream", "util", "near-api-js"],
    esbuildOptions: {
      define: {
        global: "globalThis",
        "process.env": "{}",
        "process.browser": "true"
      }
    },
  },
});

