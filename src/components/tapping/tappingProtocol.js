// Point placement and short EFT sequence: EFT International, What is EFT Tapping?
// https://eftinternational.org/discover-eft-tapping/what-is-eft-tapping/
export const RATING_QUESTION = 'How intense is the discomfort right now?';
export const TAPPING_POINTS = Object.freeze([
  { id: 'hand', name: 'Side of hand', instruction: 'Tap the soft outer edge, between your little finger and wrist.', x: 308, y: 283 },
  { id: 'crown', name: 'Top of head', instruction: 'Use your fingertips on the centre of your crown.', x: 180, y: 48 },
  { id: 'brow', name: 'Inner eyebrow', instruction: 'Tap where the eyebrow begins, beside the bridge of your nose.', x: 164, y: 111 },
  { id: 'sideEye', name: 'Side of eye', instruction: 'Tap the bone beside the outer corner of your eye.', x: 130, y: 130 },
  { id: 'underEye', name: 'Under eye', instruction: 'Tap the bone beneath your eye, in line with the pupil.', x: 153, y: 149 },
  { id: 'nose', name: 'Under nose', instruction: 'Tap the space between your nose and upper lip.', x: 180, y: 169 },
  { id: 'chin', name: 'Chin crease', instruction: 'Tap the crease below your lower lip, above your chin.', x: 180, y: 193 },
  { id: 'collar', name: 'Below collarbone', instruction: 'Tap just below the collarbone, about an inch out from the centre.', x: 157, y: 282 },
  { id: 'arm', name: 'Under arm', instruction: 'Reach across. Tap your side, about four inches below the armpit.', x: 94, y: 355 },
]);
export const CONCERNS = [
  { id: 'tension', label: 'Body tension', phrase: 'this tension' },
  { id: 'worry', label: 'A worry', phrase: 'this worry' },
  { id: 'overwhelm', label: 'Too much at once', phrase: 'this overwhelm' },
  { id: 'grounding', label: 'Just help me ground', phrase: 'this moment' },
];
export function outcomeText(before, after) {
  if (before == null || after == null) return 'No comparison needed. Notice what feels useful now.';
  if (after < before) return 'You rated the discomfort lower. Notice what feels different.';
  if (after > before) return 'You rated the discomfort higher. Let’s leave the tapping here.';
  return 'Your rating is unchanged. You can leave it here or try another approach.';
}
export function makeTappingResult({ concern, before = null, after = null, roundsCompleted = 0, stopped = false, skippedPoints = 0, durationSeconds = 0 }) {
  return { interventionId: 'eftTapping', mode: concern === 'grounding' ? 'grounding' : 'eft', concern,
    before, after, ratingQuestion: RATING_QUESTION, ratingMin: 0, ratingMax: 10,
    roundsCompleted, completed: roundsCompleted > 0, stopped, skippedPoints, durationSeconds };
}
