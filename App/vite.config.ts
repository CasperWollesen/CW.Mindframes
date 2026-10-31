import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.BASE_PATH ?? '/CW.Mindframes/';
export default defineConfig({
  base,
  server: { port: 5174 },
  preview: { port: 4174 },
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'icons/*.png'],
    manifest: {
      name: 'Mindframes', short_name: 'Mindframes', lang: 'en',
      description: 'Your photos, with a line to live by. Private and offline.',
      start_url: base, scope: base, display: 'standalone', orientation: 'portrait',
      background_color: '#0d0e12', theme_color: '#0d0e12',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    // Only the Latin subsets of the bundled fonts are precached; other scripts load on demand.
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}', '**/*latin*.woff2'], navigateFallback: `${base}index.html`, cleanupOutdatedCaches: true },
    devOptions: { enabled: false }
  })],
  build: { target: 'es2022' }
});
