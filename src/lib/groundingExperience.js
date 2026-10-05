export const GROUNDING_ALTERNATIVES = Object.freeze({
  sight: "If looking is unavailable or uncomfortable, notice five points of contact with your seat, clothes, or an object.",
  touch: "If touch is unavailable or uncomfortable, name four colours or shapes nearby instead.",
  hearing: "If listening is unavailable or uncomfortable, notice three visible details or points of contact instead.",
  smell: "No clear or comfortable scents? Notice two colours or textures instead. You do not need to find or inhale anything.",
  taste: "No clear or comfortable taste? Notice one colour or a point of contact instead. You do not need to eat or drink anything.",
});

export const GROUNDING_FEEDBACK = Object.freeze([
  { value: "more_present", label: "More present", next: "Notice one detail you want to carry with you, then choose a manageable next step." },
  { value: "unchanged", label: "Unchanged", next: "You can use a comfortable sense for longer, try another practice, or finish here. No change is a valid answer." },
  { value: "more_unsettled", label: "More unsettled", next: "Stop the sensory exercise. Look toward a familiar place if comfortable, or contact someone supportive. You can choose another kind of support." },
]);

export function groundingProgress(remaining, duration) {
  if (!Number.isFinite(remaining) || !Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remaining / duration));
}
