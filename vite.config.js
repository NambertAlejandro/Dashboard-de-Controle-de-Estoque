import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Dashboard-de-Controle-de-Estoque/' : '/',
  plugins: [react()],
  assetsInclude: ['**/*.mpeg'],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true, rewrite: path => path.replace(/^\/api/, '') } },
  },
});
