import { useEffect, useMemo, useState } from "react";
import { LeaderSelect } from "./components/LeaderSelect";
import { MatchupResult } from "./components/MatchupResult";
import { fetchStats, StatsError } from "./services/statsApi";
import { recommend } from "./lib/recommend";
import type { LeaderOption, MatchupResultData, Stats } from "./types/stats";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; stats: Stats; date: string };

function formatSnapshotDate(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function App() {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [myLeader, setMyLeader] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [result, setResult] = useState<MatchupResultData | null>(null);
  const [matchupError, setMatchupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then(({ stats, date }) => {
        if (!cancelled) setLoad({ status: "ready", stats, date });
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof StatsError
            ? err.message
            : "Unable to load matchup data. Please try again.";
        setLoad({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = load.status === "ready" ? load.stats : null;

  // Human-readable name for any leaderKey, used for both dropdowns and for
  // resolving opponent ids that appear inside matchups.
  const nameByKey = useMemo(() => {
    const map = new Map<string, string>();
    stats?.forEach((l) => map.set(l.leaderKey, l.leaderName));
    return map;
  }, [stats]);

  // "Your leader" options: every top-level leader that has matchup data.
  const myOptions: LeaderOption[] = useMemo(() => {
    if (!stats) return [];
    return stats
      .map((l) => ({ id: l.leaderKey, name: l.leaderName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stats]);

  // Opponent options depend on the selected leader: only opponents that
  // actually appear in that leader's matchups can be analyzed.
  const opponentOptions: LeaderOption[] = useMemo(() => {
    if (!stats || !myLeader) return [];
    const leader = stats.find((l) => l.leaderKey === myLeader);
    if (!leader) return [];
    return leader.matchups
      .map((m) => ({ id: m.opponentKey, name: nameByKey.get(m.opponentKey) ?? m.opponent }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stats, myLeader, nameByKey]);

  function handleMyLeaderChange(id: string) {
    setMyLeader(id);
    setOpponent(null);
    setResult(null);
    setMatchupError(null);
  }

  function handleOpponentChange(id: string) {
    setOpponent(id);
    setResult(null);
    setMatchupError(null);
  }

  function analyze() {
    setResult(null);
    setMatchupError(null);
    if (!stats || !myLeader || !opponent) return;

    const leader = stats.find((l) => l.leaderKey === myLeader);
    if (!leader) {
      setMatchupError("Selected leader was not found in the data.");
      return;
    }
    const matchup = leader.matchups.find((m) => m.opponentKey === opponent);
    if (!matchup) {
      setMatchupError("No matchup data available for this pairing.");
      return;
    }

    setResult({
      myKey: leader.leaderKey,
      myName: leader.leaderName,
      opponentKey: opponent,
      opponentName: nameByKey.get(opponent) ?? matchup.opponent,
      firstWinRate: matchup.first_win_rate,
      secondWinRate: matchup.second_win_rate,
      firstGames: matchup.first_games,
      secondGames: matchup.second_games,
      recommendation: recommend(matchup.first_win_rate, matchup.second_win_rate),
    });
  }

  const canAnalyze = Boolean(myLeader && opponent);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">First or Second?</h1>
        <p className="app__subtitle">
          One Piece TCG turn-order recommendations from live matchup win rates.
        </p>
      </header>

      {load.status === "loading" && (
        <div className="state state--loading">Loading matchup data…</div>
      )}

      {load.status === "error" && (
        <div className="state state--error">
          <p>Unable to load matchup data.</p>
          <p className="state__detail">{load.message}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}

      {load.status === "ready" && (
        <main className="app__main">
          <div className="controls">
            <LeaderSelect
              label="Your Leader"
              options={myOptions}
              value={myLeader}
              onChange={handleMyLeaderChange}
              placeholder="Search your leader…"
            />
            <LeaderSelect
              label="Opponent Leader"
              options={opponentOptions}
              value={opponent}
              onChange={handleOpponentChange}
              placeholder={myLeader ? "Search opponent…" : "Pick your leader first"}
            />
            <button className="btn btn--analyze" onClick={analyze} disabled={!canAnalyze}>
              Analyze
            </button>
          </div>

          {matchupError && <div className="state state--empty">{matchupError}</div>}

          {result && <MatchupResult data={result} />}
        </main>
      )}

      <footer className="app__footer">
        Data: Card Kaizoku · OP17
        {load.status === "ready" && ` · snapshot ${formatSnapshotDate(load.date)}`}
        {" · Recommends the higher win-rate turn order."}
      </footer>
    </div>
  );
}
