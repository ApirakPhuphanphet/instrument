import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/instruments': 'http://localhost:3000',
      '/instrument-groups': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/transactions': 'http://localhost:3000',
      '/maintenance': 'http://localhost:3000',
      '/images': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/time': 'http://localhost:3000',
      '/borrow': 'http://localhost:3000',
      '/return': 'http://localhost:3000',
      '/LF': 'http://localhost:3000',
      '/HF': 'http://localhost:3000',
      '/rfid': 'http://localhost:3000',
      '/docs': 'http://localhost:3000'
    }
  }
});
