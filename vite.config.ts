/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const CDN = "https://cdn.cardkaizoku.com";
const ALLOWED = /^(cards_en|images\/leaders)\/[A-Za-z0-9._\-/]+\.png$/;

// Mirrors the api/img.ts serverless function for local dev: fetch the image
// server-side with the cardkaizoku.com Referer the CDN's WAF requires.
function devImgProxy(): Plugin {
  return {
    name: "dev-img-proxy",
    configureServer(server) {
      server.middlewares.use("/api/img", async (req, res) => {
        const url = new URL(req.url ?? "", "http://localhost");
        const path = url.searchParams.get("p") ?? "";
        if (path.includes("..") || !ALLOWED.test(path)) {
          res.statusCode = 400;
          res.end("Bad request");
          return;
        }
        const upstream = await fetch(`${CDN}/${path}`, {
          headers: { Referer: "https://cardkaizoku.com/" },
        });
        res.statusCode = upstream.ok ? 200 : 502;
        res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "image/png");
        res.end(Buffer.from(await upstream.arrayBuffer()));
      });
    },
  };
}

// The Card Kaizoku CDN does not send CORS headers, so a browser cannot read the
// stats JSON directly. During dev we proxy /api/stats through Vite to the CDN.
export default defineConfig({
  plugins: [react(), devImgProxy()],
  server: {
    proxy: {
      "/api/stats": {
        target: CDN,
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
