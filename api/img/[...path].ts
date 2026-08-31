import type { IncomingMessage, ServerResponse } from "node:http";

// Node serverless proxy for CDN images whose WAF requires a cardkaizoku.com
// Referer. A browser <img> from our own origin can't send that referer, so we
// fetch server-side with the required header and return the image.
//
// NB: this MUST run on the Node runtime, not Edge. The Edge runtime's fetch is
// spec-compliant and silently strips `Referer` (a forbidden request header), so
// the CDN would still 403. Node's undici fetch sends it. (Node is the default
// runtime — no `config.runtime = "edge"`.)

const CDN = "https://cdn.cardkaizoku.com";
const ALLOWED = /^(cards_en|images\/leaders)\/[A-Za-z0-9._\-/]+\.png$/;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url ?? "", "http://localhost");
  const path = decodeURIComponent(url.pathname.replace(/^\/api\/img\//, ""));

  if (path.includes("..") || !ALLOWED.test(path)) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  const upstream = await fetch(`${CDN}/${path}`, {
    headers: { Referer: "https://cardkaizoku.com/" },
  });

  if (!upstream.ok) {
    res.statusCode = upstream.status;
    res.end("Image not found");
    return;
  }

  const body = new Uint8Array(await upstream.arrayBuffer());
  res.statusCode = 200;
  res.setHeader("Content-Type", upstream.headers.get("Content-Type") ?? "image/png");
  // 1 day in-browser, 30 days on Vercel's edge cache (shared across visitors).
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000, immutable");
  res.end(body);
}
