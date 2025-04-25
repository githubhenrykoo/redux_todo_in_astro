// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import vercel from '@astrojs/vercel';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable server-side rendering
  adapter: vercel(), // Add Vercel adapter
  integrations: [
    react(),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      registerType: 'prompt',
      manifest: {
        name: 'Redux Todo in Astro',
        short_name: 'Redux Todo',
        description: 'A Todo application built with Astro and Redux',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              return url.origin === self.location.origin && 
                    (url.pathname.endsWith('.png') || 
                     url.pathname.endsWith('.jpg') || 
                     url.pathname.endsWith('.svg') || 
                     url.pathname.endsWith('.webp'));
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: new RegExp('/_astro/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'astro-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              return url.origin === self.location.origin && url.pathname.startsWith('/api');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: ({ url }) => {
              return url.origin === self.location.origin;
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/',
      }
    })
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
        '@pages': path.resolve('./src/pages')
      }
    },
    server: {
      hmr: {
        clientPort: 4321
      },
      watch: {
        usePolling: true
      },
      strictPort: true,
      proxy: {},
      cors: true,
      host: true, 
      allowedHosts: true 
    },
    build: {
      rollupOptions: {
        external: ['child_process', 'fs', 'path', 'os', 'crypto', 'util']
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4321,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://*.gstatic.com;",
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
});
