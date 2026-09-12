import React from "react";

// Per-direction descriptor scales. Low end = the desired state / least
// distressed; high end = most stuck. Lift inverts (low = very low mood,
// high = radiant) and so uses a reversed gradient. Each scale's language is
// specific to the direction the user selected — focus reads as concentration,
// ground as presence, reset as rumination, sleep as wakefulness.
const SCALES = {
  calm: {
    words: ["Calm", "Steady", "A little rattled", "Unsettled", "On edge", "Tense", "Rising", "High", "Surging", "Overwhelming", "Maxed out"],
    left: "Calm", right: "Extreme",
    gradient: "from-teal/60 via-indigo/50 to-destructive/70",
  },
  lift: {
    words: ["Awful", "Very low", "Low", "Heavy", "Flat", "So-so", "Okay-ish", "Okay", "Good", "Great", "Radiant"],
    left: "Very low", right: "Great",
    gradient: "from-destructive/70 via-indigo/50 to-teal/60",
  },
  focus: {
    words: ["Locked in", "Clear", "Steady", "A bit scattered", "Drifting", "Mind wandering", "Hard to settle", "Foggy", "Can't focus", "Stuck", "Paralyzed"],
    left: "Focused", right: "Can't focus",
    gradient: "from-teal/60 via-indigo/50 to-destructive/70",
  },
  ground: {
    words: ["Present", "Here", "Mostly here", "A little fuzzy", "Spacy", "Disconnected", "Numb", "Floaty", "Far away", "Not here", "Gone"],
    left: "Present", right: "Gone",
    gradient: "from-teal/60 via-indigo/50 to-destructive/70",
  },
  reset: {
    words: ["Clear", "Settled", "A few thoughts", "Chattering", "Looping", "Racing", "Stuck on one thing", "Spiraling", "Loud", "Consuming", "Takeover"],
    left: "Clear", right: "Consuming",
    gradient: "from-teal/60 via-indigo/50 to-destructive/70",
  },
  sleep: {
    words: ["Drowsy", "Heavy", "Settling", "Neutral", "A bit alert", "Awake", "Wired", "Buzzing", "Wide awake", "Racing mind", "Fully wired"],
    left: "Drowsy", right: "Wide awake",
    gradient: "from-teal/60 via-indigo/50 to-destructive/70",
  },
};

export default function IntensityDial({ value, onChange, mood = false, direction, compact = false }) {
  const v = Number(value);
  const key = direction || (mood ? "lift" : "calm");
  const scale = SCALES[key] || SCALES.calm;
  const sliderClass = `reset-slider h-3 w-full cursor-pointer rounded-full bg-gradient-to-r ${scale.gradient} outline-none`;
  const descriptor = scale.words[v] ?? "—";

  return (
    <div className={"flex flex-col items-center " + (compact ? "gap-3" : "gap-6")}>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        1 is mild, 5 is moderate, 9 is intense. There’s no wrong answer.
      </p>
      <div className="flex items-end gap-1.5">
        <span className={"font-heading font-medium leading-none tracking-tight text-primary tabular-nums " + (compact ? "text-6xl" : "text-7xl")}>
          {v}
        </span>
        <span className="mb-2 text-lg font-medium text-muted-foreground">/10</span>
      </div>
      <span aria-live="polite" className="font-heading text-xl text-indigo italic">{descriptor}</span>

      <div className="mt-2 w-full max-w-md">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="How intense is it right now"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={v}
          aria-valuetext={`${v} out of 10, ${descriptor}`}
          className={sliderClass}
        />
        <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground">
          <span>{scale.left}</span>
          <span>{scale.right}</span>
        </div>
        <div className="mt-2 flex justify-between text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground/70">
          <span>1 mild</span>
          <span>5 moderate</span>
          <span>9 intense</span>
        </div>
      </div>

      {!compact && (
        <div className="mt-1 grid w-full grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              aria-label={String(i)}
              aria-pressed={i === v}
              className={
                "flex h-9 items-center justify-center rounded-full text-sm font-medium transition-all " +
                (i === v
                  ? "bg-primary text-primary-foreground soft-depth scale-110 shadow-[0_6px_18px_hsl(179_69%_17%/0.35)]"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70")
              }
            >
              {i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}