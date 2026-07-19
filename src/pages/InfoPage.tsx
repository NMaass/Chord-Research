import { useStats } from "../hooks/useStats";
import { formatResearchPercentage } from "../utils/researchStats";

export function InfoPage() {
  const { stats, loading, error, retry } = useStats();

  return (
    <main className="info">
      <div className="info-description">
        <p>
          At Chord Research Inc., we are attempting to find and document all
          possible four-chord progressions.
        </p>
        <p>
          The process is simple: pick four basic piano chords — twelve majors
          and twelve minors are available — and press research. Your
          progression is performed at 100 beats per minute, with a new chord
          every two beats.
        </p>
        <p>
          If the progression has never been played before, it is added to the
          record and attributed to you, its discoverer, along with the exact
          time of discovery. If it has been played before, the record shows who
          found it and when.
        </p>
        <p>
          With 24 chords and four slots, there are exactly 331,776 possible
          progressions. Every one of them deserves to be heard at least once.
        </p>
      </div>

      <section className="stats-section about-progress">
        <div className="stats-label">all chords researched</div>
        {stats ? (
          <>
            <div className="stats-value">
              {formatResearchPercentage(
                stats.total_progressions,
                stats.possible_progressions
              )}
            </div>
            <div className="stats-sub">
              {stats.total_progressions.toLocaleString()} of{" "}
              {stats.possible_progressions.toLocaleString()} progressions
            </div>
          </>
        ) : loading ? (
          <div className="loading stats-placeholder">loading...</div>
        ) : (
          <div className="error-state compact" role="alert">
            <p>percentage unavailable: {error ?? "unknown server error"}</p>
            <button className="text-button" type="button" onClick={() => void retry()}>
              retry
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
