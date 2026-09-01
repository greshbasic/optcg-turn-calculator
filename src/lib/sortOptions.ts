import type { LeaderOption } from "../types/stats";

// Orders dropdown options by play rate (most-played first) instead of
// alphabetically. Leaders missing from the play-rate map (shouldn't happen,
// but keeps this defensive) sort as if they have a 0% play rate.
export function sortByPlayRate(
  options: LeaderOption[],
  playRateByKey: Map<string, number>
): LeaderOption[] {
  return [...options].sort(
    (a, b) => (playRateByKey.get(b.id) ?? 0) - (playRateByKey.get(a.id) ?? 0)
  );
}
