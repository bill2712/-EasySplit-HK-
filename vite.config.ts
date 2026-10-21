/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { seoPlugin } from './seo/plugin';

// Served from GitHub Pages at /-EasySplit-HK-/
export default defineConfig({
  base: '/-EasySplit-HK-/',
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [
    react(),
    tailwindcss(),
    seoPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'EasySplit 夾錢易',
        short_name: 'EasySplit',
        description: 'Split bills, gatherings and trips — service charge, tax, tips and multi-currency.',
        theme_color: '#0f9d74',
        background_color: '#f4f4f5',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Content pages (guide, legal, 404) are plain HTML: don't precache them
        // and let the browser load them normally instead of the app shell.
        globIgnores: ['og-image.png', '404.html', '**/firestore-*.js', '**/tipping/**', '**/privacy/**', '**/terms/**', '**/about/**'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/tipping\//, /\/(privacy|terms|about)\//, /404\.html$/],
        // Firebase is only needed for live groups: cache it the first time it's used.
        runtimeCaching: [
          {
            urlPattern: /\/assets\/firestore-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'easysplit-live', expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
