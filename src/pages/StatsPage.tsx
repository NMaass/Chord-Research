import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, chordLabel, formatDate } from "../api/client";
import type { Stats } from "../types";

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.stats().then(({ ok, data }) => {
      if (ok) setStats(data);
    });
  }, []);

  if (!stats) {
    return (
      <main className="info">
        <p className="loading">loading...</p>
      </main>
    );
  }

  const pct =
    stats.possible_progressions > 0
      ? ((stats.total_progressions / stats.possible_progressions) * 100).toFixed(2)
      : "0";

  return (
    <main className="info">
      <section className="stats-section">
        <div className="stats-label">progressions researched</div>
        <div className="stats-value">{stats.total_progressions}</div>
        <div className="stats-sub">
          of {stats.possible_progressions.toLocaleString()} possible ({pct}%)
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-label">researchers</div>
        <div className="stats-value">{stats.total_researchers}</div>
      </section>

      <section className="stats-section">
        <div className="stats-label">total plays</div>
        <div className="stats-value">{stats.total_plays}</div>
      </section>

      <section className="stats-section">
        <div className="stats-label">recent discoveries</div>
        {stats.recent.length === 0 ? (
          <div className="empty-state">
            no progressions researched yet — be the first
          </div>
        ) : (
          <ul className="top-list">
            {stats.recent.map((r) => (
              <li key={r.id}>
                <span className="top-chords">{chordLabel(r.chords)}</span>
                <span className="top-count">
                  <Link to={`/profile/${r.discovered_by}`}>
                    @{r.discovered_by}
                  </Link>{" "}
                  &middot; {formatDate(r.discovered_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stats-section">
        <div className="stats-label">top researchers</div>
        {stats.top_researchers.length === 0 ? (
          <div className="empty-state">no researchers yet</div>
        ) : (
          <ul className="top-list">
            {stats.top_researchers.map((t) => (
              <li key={t.username}>
                <span className="top-chords">
                  <Link to={`/profile/${t.username}`}>@{t.username}</Link>
                </span>
                <span className="top-count">
                  {t.count}{" "}
                  {t.count === 1 ? "progression" : "progressions"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
