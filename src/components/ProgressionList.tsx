import { useState } from "react";
import { formatDate, formatTime, chordLabel } from "../api/client";
import { playProgression, stopPlayback } from "../audio/player";
import type { Progression } from "../types";

interface ProgressionListProps {
  progressions: Progression[];
  canFavorite: boolean;
  onToggleFavorite?: (id: number, favorite: boolean) => void;
  emptyMessage?: string;
}

export function ProgressionList({
  progressions,
  canFavorite,
  onToggleFavorite,
  emptyMessage = "nothing here yet",
}: ProgressionListProps) {
  const [playingId, setPlayingId] = useState<number | null>(null);

  const togglePlay = (p: Progression) => {
    if (playingId === p.id) {
      stopPlayback();
      setPlayingId(null);
      return;
    }
    setPlayingId(p.id);
    playProgression(p.chords).done.then(() => setPlayingId(null));
  };

  if (progressions.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <ul className="progression-list">
      {progressions.map((p) => (
        <li key={p.id} className="progression">
          <div className="progression-main">
            <div
              className={`progression-chords${
                playingId === p.id ? " playing" : ""
              }`}
            >
              {chordLabel(p.chords)}
            </div>
            <div className="progression-meta">
              {formatDate(p.discovered_at)} at {formatTime(p.discovered_at)}
              {p.play_count > 1 && <> &middot; played {p.play_count} times</>}
            </div>
          </div>
          <div className="progression-actions">
            <button
              className="icon-button"
              onClick={() => togglePlay(p)}
              aria-label={playingId === p.id ? "stop" : "play"}
              title={playingId === p.id ? "stop" : "play at 100 bpm"}
            >
              {playingId === p.id ? "■" : "▶"}
            </button>
            {canFavorite && (
              <button
                className={`icon-button${p.is_favorite ? " active" : ""}`}
                onClick={() => onToggleFavorite?.(p.id, !p.is_favorite)}
                aria-label={p.is_favorite ? "unfavorite" : "favorite"}
                title={p.is_favorite ? "unfavorite" : "favorite"}
              >
                {p.is_favorite ? "★" : "☆"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
