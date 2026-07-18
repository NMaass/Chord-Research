import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, chordLabel, formatDate, formatTime } from "../api/client";
import { playProgression, stopPlayback, BPM } from "../audio/player";
import { useAuth } from "../auth/AuthContext";
import { ChordSlots } from "../components/ChordSlots";
import type { ResearchResult } from "../types";

export function ResearchPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [playing, setPlaying] = useState(false);
  const [activeSlot, setActiveSlot] = useState(-1);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personalCount, setPersonalCount] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const allFilled = slots.every((c) => c !== null);

  const refreshPersonalCount = useCallback(() => {
    if (!user) {
      setPersonalCount(null);
      return;
    }
    api.profile(user.username).then(({ ok, data }) => {
      if (ok) setPersonalCount(data.total);
    });
  }, [user]);

  useEffect(refreshPersonalCount, [refreshPersonalCount]);

  useEffect(() => () => stopPlayback(), []);

  const handlePlay = () => {
    if (!allFilled) return;

    if (playing) {
      stopPlayback();
      setPlaying(false);
      setActiveSlot(-1);
      return;
    }

    const chords = slots as string[];
    setPlaying(true);
    setError(null);
    setResult(null);

    playProgression(chords, setActiveSlot).done.then(() => {
      setPlaying(false);
      setActiveSlot(-1);
    });

    api
      .research(chords)
      .then(({ ok, data }) => {
        if (!ok) {
          setError((data as { error?: string }).error ?? "something went wrong");
          return;
        }
        setResult(data);
        if (data.is_new && data.claimed) refreshPersonalCount();
      })
      .catch(() => setError("failed to connect. please try again."));
  };

  return (
    <main className="home">
      <ChordSlots
        slots={slots}
        onChange={setSlots}
        activeIndex={activeSlot}
        disabled={false}
      />

      <button
        className="play-button"
        onClick={handlePlay}
        disabled={!allFilled && !playing}
      >
        {playing ? "■ stop" : `▶ play at ${BPM} bpm`}
      </button>
      <p className="input-hint">
        {allFilled
          ? "press play — if it's never been played, it's yours"
          : "pick four chords"}
      </p>

      <div ref={resultRef} aria-live="polite">
        {error && <div className="result result-error">{error}</div>}

        {result && result.is_new && result.claimed && (
          <div className="result result-new">
            <span className="result-chords">{chordLabel(result.chords)}</span>{" "}
            is a new progression!
            <div className="result-meta">researched by you just now</div>
          </div>
        )}

        {result && result.is_new && !result.claimed && (
          <div className="result result-new">
            <span className="result-chords">{chordLabel(result.chords)}</span>{" "}
            has never been played
            <div className="result-meta">
              <Link to="/login">log in</Link> or{" "}
              <Link to="/register">register</Link> to claim it
            </div>
          </div>
        )}

        {result && !result.is_new && (
          <div className="result result-found">
            <span className="result-chords">{chordLabel(result.chords)}</span>{" "}
            was already researched
            <div className="result-meta">
              discovered by{" "}
              <Link to={`/profile/${result.discovered_by}`}>
                @{result.discovered_by}
              </Link>{" "}
              on {formatDate(result.discovered_at!)} at{" "}
              {formatTime(result.discovered_at!)}
              {result.play_count! > 1 && (
                <> &middot; played {result.play_count} times</>
              )}
            </div>
          </div>
        )}
      </div>

      {personalCount !== null && personalCount > 0 && (
        <div className="personal-stats">
          you've researched{" "}
          <span className="personal-count">{personalCount}</span> new{" "}
          {personalCount === 1 ? "progression" : "progressions"}
        </div>
      )}
    </main>
  );
}
