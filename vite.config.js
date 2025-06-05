import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // Allow all hosts, including kube.pkc.pub
    host: '0.0.0.0',
    hmr: {
      clientPort: 4321,
      overlay: false
    },
    // This is the most important setting to allow all hosts
    allowedHosts: 'all',
    cors: {
      origin: '*'
    },
    strictPort: false,
    fs: {
      allow: ['..']
    }
  }
});
