import { useEffect, useRef, useState } from "react";
import { MAJOR_CHORDS, MINOR_CHORDS } from "../audio/chords";
import { previewChord } from "../audio/player";

interface ChordSlotsProps {
  slots: (string | null)[];
  onChange: (slots: (string | null)[]) => void;
  activeIndex: number; // currently sounding chord, -1 when idle
  disabled: boolean;
}

export function ChordSlots({
  slots,
  onChange,
  activeIndex,
  disabled,
}: ChordSlotsProps) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openSlot === null) return;
    const onDocClick = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setOpenSlot(null);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSlot(null);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [openSlot]);

  const pick = (chord: string) => {
    if (openSlot === null) return;
    previewChord(chord);
    const next = [...slots];
    next[openSlot] = chord;
    onChange(next);
    // advance to the next empty slot for fast entry
    const nextEmpty = next.findIndex((c, i) => i > openSlot && c === null);
    setOpenSlot(nextEmpty === -1 ? null : nextEmpty);
  };

  return (
    <div ref={pickerRef}>
      <div className="slots" role="group" aria-label="chord slots">
        {slots.map((chord, i) => (
          <button
            key={i}
            type="button"
            className={[
              "slot",
              chord ? "" : "slot-empty",
              openSlot === i ? "slot-open" : "",
              activeIndex === i ? "slot-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled}
            aria-label={`slot ${i + 1}${chord ? `: ${chord}` : ": empty"}`}
            onClick={() => setOpenSlot(openSlot === i ? null : i)}
          >
            {chord ?? "· · ·"}
          </button>
        ))}
      </div>

      {openSlot !== null && (
        <div className="picker" role="listbox" aria-label="pick a chord">
          <div className="picker-label">major</div>
          <div className="picker-row">
            {MAJOR_CHORDS.map((chord) => (
              <button
                key={chord}
                type="button"
                className={`picker-chord${
                  slots[openSlot] === chord ? " selected" : ""
                }`}
                onClick={() => pick(chord)}
              >
                {chord}
              </button>
            ))}
          </div>
          <div className="picker-label">minor</div>
          <div className="picker-row">
            {MINOR_CHORDS.map((chord) => (
              <button
                key={chord}
                type="button"
                className={`picker-chord${
                  slots[openSlot] === chord ? " selected" : ""
                }`}
                onClick={() => pick(chord)}
              >
                {chord}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
