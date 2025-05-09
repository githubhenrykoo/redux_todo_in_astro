import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [react(), tailwind()],
  output: "server",
  server: {
    host: "0.0.0.0",
    port: 4321,
  },
  vite: {
    server: {
      hmr: {
        protocol: "ws",
        host: "0.0.0.0",
        port: 24678,
        clientPort: 24678,
      },
      watch: {
        usePolling: true,
      },
    },
  },
});
