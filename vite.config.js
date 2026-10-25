import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In local dev, /api/sales-orders is proxied to the mock API with the key attached
// server-side (same job the Vercel function in api/proxy.js does in production).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: {
      sourcemap: false, // do not publish readable source maps
      assetsInlineLimit: 0, // never inline assets as data: URIs (keeps the CSP strict)
    },
    server: {
      proxy: {
        '/api/sales-orders': {
          target: 'https://hiring.harrisons.my',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/sales-orders/, '/api/mock/sales-orders'),
          headers: { 'x-assessment-key': env.ASSESSMENT_API_KEY || '' },
        },
      },
    },
  };
});
