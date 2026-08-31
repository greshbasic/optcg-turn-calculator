import type { Recommendation } from "../types/stats";

// A null rate means that turn order has no recorded games — it can't be
// compared, so we recommend the side that does have data. If both are null we
// have nothing to go on ("EVEN" → shown as "NO CLEAR ADVANTAGE").
export function recommend(
  first: number | null,
  second: number | null
): Recommendation {
  if (first === null && second === null) return "EVEN";
  if (first === null) return "SECOND";
  if (second === null) return "FIRST";
  if (first > second) return "FIRST";
  if (second > first) return "SECOND";
  return "EVEN";
}
