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

    // Advance to the next empty slot for fast entry.
    const nextEmpty = next.findIndex((candidate, index) => {
      return index > openSlot && candidate === null;
    });
    setOpenSlot(nextEmpty === -1 ? null : nextEmpty);
  };

  return (
    <div className="chord-input" ref={pickerRef}>
      <div className="slots" role="group" aria-label="chord slots">
        {slots.map((chord, index) => (
          <button
            key={index}
            type="button"
            className={[
              "slot",
              chord ? "" : "slot-empty",
              openSlot === index ? "slot-open" : "",
              activeIndex === index ? "slot-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled}
            aria-expanded={openSlot === index}
            aria-controls="chord-picker-region"
            aria-label={`slot ${index + 1}${chord ? `: ${chord}` : ": empty"}`}
            onClick={() => setOpenSlot(openSlot === index ? null : index)}
          >
            {chord ?? "· · ·"}
          </button>
        ))}
      </div>

      <div className="picker-region" id="chord-picker-region">
        {openSlot === null ? (
          <div className="picker-placeholder">
            select a chord slot to open the picker
          </div>
        ) : (
          <div className="picker" aria-label={`pick chord for slot ${openSlot + 1}`}>
            <div className="picker-label">major</div>
            <div className="picker-row">
              {MAJOR_CHORDS.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  className={`picker-chord${
                    slots[openSlot] === chord ? " selected" : ""
                  }`}
                  aria-pressed={slots[openSlot] === chord}
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
                  aria-pressed={slots[openSlot] === chord}
                  onClick={() => pick(chord)}
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
