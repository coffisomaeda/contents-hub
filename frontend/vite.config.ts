import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Contents Hub',
        short_name: 'ContentsHub',
        description: '読んだ本・観た映画・ゲームなどのコンテンツを管理するアプリ',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ch-pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('/__data.json'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ch-data',
              expiration: { maxEntries: 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ['distributed-wit-firm-rack.trycloudflare.com'],
  },
});
