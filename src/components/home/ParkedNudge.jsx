// A slim, single-line nudge for a note parked last night — replaces what
// used to be a full dark promo block matching Journal/Good Map/Dear 2100.
// One parked note doesn't need the same visual weight as those; this stays
// out of the way while still being easy to find and reach 44px min height.
import React from "react";
import { ArrowRight } from "lucide-react";

export default function ParkedNudge({ onOpen }) {
  return (
    <div className="px-5 pt-4">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Review what you parked last night"
        className="no-tap flex min-h-11 w-full items-center gap-3 rounded-[18px] border border-[var(--home-ink)]/10 bg-white/55 px-4 py-2.5 text-left backdrop-blur transition-transform active:scale-[0.99]"
      >
        <span aria-hidden="true" className="text-base leading-none">🅿️</span>
        <span className="min-w-0 flex-1 truncate text-[0.82rem] font-medium text-[var(--home-ink)]">Something's parked from last night</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--home-ink)]/50" />
      </button>
    </div>
  );
}
