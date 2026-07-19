import { Link } from "react-router-dom";
import { chordLabel, formatDate } from "../api/client";
import { useStats } from "../hooks/useStats";
import { formatResearchPercentage } from "../utils/researchStats";

export function StatsPage() {
  const { stats, loading, error, retry } = useStats();

  if (!stats) {
    return (
      <main className="info">
        {loading ? (
          <p className="loading">loading...</p>
        ) : (
          <div className="error-state" role="alert">
            <p>could not load stats: {error ?? "unknown server error"}</p>
            <button className="text-button" type="button" onClick={() => void retry()}>
              retry
            </button>
          </div>
        )}
      </main>
    );
  }

  const percentage = formatResearchPercentage(
    stats.total_progressions,
    stats.possible_progressions
  );

  return (
    <main className="info">
      {error && (
        <div className="inline-warning" role="status">
          showing the last loaded stats; refresh failed: {error}
        </div>
      )}

      <section className="stats-section">
        <div className="stats-label">progressions researched</div>
        <div className="stats-value">{stats.total_progressions}</div>
        <div className="stats-sub">
          of {stats.possible_progressions.toLocaleString()} possible ({percentage})
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
            {stats.recent.map((research) => (
              <li key={research.id}>
                <span className="top-chords">
                  {chordLabel(research.chords)}
                </span>
                <span className="top-count">
                  <Link to={`/profile/${research.discovered_by}`}>
                    @{research.discovered_by}
                  </Link>{" "}
                  &middot; {formatDate(research.discovered_at)}
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
            {stats.top_researchers.map((researcher) => (
              <li key={researcher.username}>
                <span className="top-chords">
                  <Link to={`/profile/${researcher.username}`}>
                    @{researcher.username}
                  </Link>
                </span>
                <span className="top-count">
                  {researcher.count}{" "}
                  {researcher.count === 1 ? "progression" : "progressions"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
