// Types mirror the actual Card Kaizoku stats endpoint response.
// Each top-level entry is one leader's full statistics, including a matchups
// array with per-opponent first/second win rates and sample sizes.

export interface Matchup {
  opponent: string;
  opponentKey: string;
  wins: number;
  total_games: number;
  matchup_win_rate: number;
  first_wins: number;
  first_games: number;
  first_win_rate: number | null;
  second_wins: number;
  second_games: number;
  second_win_rate: number | null;
}

export interface LeaderStats {
  leader: string;
  leaderKey: string;
  variantName: string | null;
  leaderName: string;
  wins: number;
  number_of_matches: number;
  total_matches: number;
  raw_win_rate: number;
  play_rate: number;
  weighted_win_rate: number;
  first_win_rate: number;
  second_win_rate: number;
  matchups: Matchup[];
}

export type Stats = LeaderStats[];

// A minimal option shape for the dropdowns: human-readable label + internal id.
export interface LeaderOption {
  id: string; // leaderKey
  name: string; // leaderName
}

export type Recommendation = "FIRST" | "SECOND" | "EVEN";

export interface MatchupResultData {
  myKey: string;
  myName: string;
  opponentKey: string;
  opponentName: string;
  firstWinRate: number | null;
  secondWinRate: number | null;
  firstGames: number;
  secondGames: number;
  recommendation: Recommendation;
}
