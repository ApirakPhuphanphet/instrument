import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || 'http://localhost:3000';

  return {
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
        '/instruments': backendUrl,
        '/instrument-groups': backendUrl,
        '/users': backendUrl,
        '/transactions': backendUrl,
        '/maintenance': backendUrl,
        '/images': backendUrl,
        '/health': backendUrl,
        '/time': backendUrl,
        '/borrow': backendUrl,
        '/return': backendUrl,
        '/LF': backendUrl,
        '/HF': backendUrl,
        '/rfid': backendUrl,
        '/rfids': backendUrl,
        '/dashboard': backendUrl,
        '/staff': backendUrl,
        '/instrument': backendUrl,
        '/docs': backendUrl
      }
    }
  };
});
