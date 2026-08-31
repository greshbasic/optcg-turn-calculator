import { useState } from "react";

// Leader art lives on the CDN at two possible paths. Images load fine in <img>
// tags (no CORS needed for display). We try the cropped leader art first, then
// the full-card art for leaders that path is missing (mostly the newest sets),
// then fall back to a colored initials chip if neither exists.
const setOf = (leaderKey: string) => leaderKey.slice(0, leaderKey.indexOf("-"));

function imageUrls(leaderKey: string): string[] {
  const key = encodeURIComponent(leaderKey);
  return [
    `https://cdn.cardkaizoku.com/images/leaders/${key}.png`,
    `https://cdn.cardkaizoku.com/cards_en/${encodeURIComponent(setOf(leaderKey))}/${key}.png`,
  ];
}

// Deterministic hue from the leader id so each fallback chip has a stable color.
function hueFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function initials(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || "?").toUpperCase();
}

interface Props {
  leaderKey: string;
  name: string;
  size?: number;
}

export function LeaderThumb({ leaderKey, name, size = 28 }: Props) {
  const urls = imageUrls(leaderKey);
  // Index of the current candidate URL; advance on error until we run out.
  const [srcIndex, setSrcIndex] = useState(0);
  const style = { width: size, height: size } as const;
  const failed = srcIndex >= urls.length;

  if (failed) {
    const hue = hueFor(leaderKey);
    return (
      <span
        className="thumb thumb--fallback"
        style={{
          ...style,
          background: `linear-gradient(135deg, hsl(${hue} 55% 40%), hsl(${(hue + 40) % 360} 55% 30%))`,
          fontSize: Math.round(size * 0.4),
        }}
        aria-hidden
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      key={urls[srcIndex]}
      className="thumb"
      style={style}
      src={urls[srcIndex]}
      alt=""
      loading="lazy"
      onError={() => setSrcIndex((i) => i + 1)}
    />
  );
}
