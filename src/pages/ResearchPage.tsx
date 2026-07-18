import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, chordLabel, formatDate, formatTime } from "../api/client";
import { playProgression, stopPlayback } from "../audio/player";
import { useAuth } from "../auth/AuthContext";
import { ChordSlots } from "../components/ChordSlots";
import type { ResearchResult } from "../types";

export function ResearchPage() {
  const { user, register } = useAuth();
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [playing, setPlaying] = useState(false);
  const [activeSlot, setActiveSlot] = useState(-1);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personalCount, setPersonalCount] = useState<number | null>(null);
  const [claimUser, setClaimUser] = useState("");
  const [claimPass, setClaimPass] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
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

  const handleSlotsChange = (next: (string | null)[]) => {
    setSlots(next);
    setResult(null);
    setError(null);
    setClaimError(null);
  };

  // Register and immediately claim the just-discovered progression,
  // without leaving the page or losing the slots.
  const handleClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!result || claiming) return;
    setClaiming(true);
    setClaimError(null);
    const err = await register(claimUser.trim(), claimPass);
    if (err) {
      setClaiming(false);
      setClaimError(err);
      return;
    }
    const { ok, data } = await api.research(result.chords);
    setClaiming(false);
    if (ok) {
      setResult(data);
      refreshPersonalCount();
    } else {
      setClaimError("account created, but failed to claim the progression");
    }
  };

  return (
    <main className="home">
      <ChordSlots
        slots={slots}
        onChange={handleSlotsChange}
        activeIndex={activeSlot}
        disabled={false}
      />

      <button
        className="play-button"
        onClick={handlePlay}
        disabled={!allFilled && !playing}
      >
        {playing ? "■ stop" : "research"}
      </button>
      {!allFilled && <p className="input-hint">pick four chords</p>}

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
            <form className="claim-form" onSubmit={handleClaim}>
              <input
                className="auth-input"
                placeholder="username"
                value={claimUser}
                onChange={(e) => setClaimUser(e.target.value)}
                autoComplete="username"
                maxLength={20}
              />
              <input
                className="auth-input"
                type="password"
                placeholder="password (6+ chars)"
                value={claimPass}
                onChange={(e) => setClaimPass(e.target.value)}
                autoComplete="new-password"
                maxLength={128}
              />
              <button
                className="auth-submit"
                type="submit"
                disabled={claiming || !claimUser.trim() || !claimPass}
              >
                {claiming ? "..." : "claim it →"}
              </button>
              {claimError && <div className="auth-error">{claimError}</div>}
              <div className="auth-switch">
                already a researcher? <Link to="/login">login</Link>
              </div>
            </form>
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
