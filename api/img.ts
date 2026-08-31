import type { IncomingMessage, ServerResponse } from "node:http";

// Node serverless proxy for CDN images whose WAF requires a cardkaizoku.com
// Referer (a browser <img> from our origin can't send that). The image path is
// passed as a `p` query param — NOT as a path segment — because a path ending
// in `.png` gets intercepted by Vercel's static-asset router and never reaches
// the function. Must run on the Node runtime (Edge's fetch strips Referer).

const CDN = "https://cdn.cardkaizoku.com";
const ALLOWED = /^(cards_en|images\/leaders)\/[A-Za-z0-9._\-/]+\.png$/;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url ?? "", "http://localhost");
  const path = url.searchParams.get("p") ?? "";

  if (path.includes("..") || !ALLOWED.test(path)) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CDN}/${path}`, {
      headers: { Referer: "https://cardkaizoku.com/" },
      redirect: "manual", // don't follow the CDN elsewhere (SSRF defense-in-depth)
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    res.statusCode = 504;
    res.end("Upstream unavailable");
    return;
  }

  if (!upstream.ok) {
    res.statusCode = upstream.status >= 400 ? upstream.status : 502;
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
