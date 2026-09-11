import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: "promote-IT",
          short_name: "promote-IT",
          description: "Regional Expansion Video Toolkit",
          display: "standalone",
          orientation: "any",
          theme_color: "#0f172a",
          background_color: "#020617",
          icons: [
            {
              src: "/icon-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/huggingface\.co\/.*\/resolve\/main\/.*$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'webllm-model-weights',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /.*\.wasm$/,
              handler: 'CacheFirst',
              options: { cacheName: 'wasm-engine-cache' }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
