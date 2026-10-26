import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В dev-режиме запросы /api и /health проксируются на локальный бэкенд.
const backend = process.env.BACKEND_URL ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8080,
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/health': { target: backend, changeOrigin: true },
    },
  },
  preview: { host: true, port: 8080 },
});
