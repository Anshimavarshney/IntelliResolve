import { defineConfig } from "vite";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: {
        enabled: true,
        outputPath: "/index.html",
      },
    },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },
});
