import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: here,
  plugins: [react()],
  resolve: {
    alias: {
      '@gotfive/shared': path.resolve(here, '../shared/src/index.ts'),
      '@': path.resolve(here, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // En developpement, le client parle au serveur via la meme origine.
      '/socket.io': {
        target: process.env['VITE_SERVER_URL'] ?? 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
  },
  preview: {
    port: 4173,
    proxy: {
      '/socket.io': {
        target: process.env['VITE_SERVER_URL'] ?? 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
