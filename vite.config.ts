import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In `vite dev`, proxy API calls to the wrangler dev server
      // (run `wrangler dev` on :8787 alongside, or just use `npm run dev:worker`).
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
