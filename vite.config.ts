/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Card Kaizoku CDN does not send CORS headers, so a browser cannot read
// the response directly. During dev we proxy through Vite; the browser talks
// to same-origin /api/... and Vite forwards to the CDN server-side.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/stats": {
        target: "https://cdn.cardkaizoku.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stats/, "/stats"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
