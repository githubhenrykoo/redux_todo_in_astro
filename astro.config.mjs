// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
        '@pages': path.resolve('./src/pages')
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4321
  }
});
