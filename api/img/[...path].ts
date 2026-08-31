// Edge proxy for CDN images whose WAF requires a cardkaizoku.com Referer.
// A browser <img> from our own origin can't send that referer, so we fetch
// server-side with the required header and stream the image back. Only the
// ~17 leaders missing from /images/leaders/ actually need this (they fall back
// to /cards_en/...), but the proxy accepts either image path.
export const config = { runtime: "edge" };

const CDN = "https://cdn.cardkaizoku.com";
const ALLOWED = /^(cards_en|images\/leaders)\/[A-Za-z0-9._\-/]+\.png$/;

export default async function handler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const path = decodeURIComponent(pathname.replace(/^\/api\/img\//, ""));

  if (path.includes("..") || !ALLOWED.test(path)) {
    return new Response("Bad request", { status: 400 });
  }

  const upstream = await fetch(`${CDN}/${path}`, {
    headers: { Referer: "https://cardkaizoku.com/" },
  });

  if (!upstream.ok) {
    return new Response("Image not found", { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
      // Cache hard: 1 day in the browser, 30 days on Vercel's edge (shared
      // across all visitors), so we hit the origin at most once per image.
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
    },
  });
}
