import { CONCERNS, TAPPING_POINTS } from './tappingProtocol';
import { TAPPING_ARTWORK } from './tappingArtwork';

// Only confirmed answers and fully elapsed guidance belong here. Settings,
// navigation, skipped points and interrupted timers are deliberately ignored.
export function recordTappingProgress(events = [], action) {
  let id, label, detail;
  if (action.type === 'focus') {
    id = 'focus'; label = 'Your chosen focus';
    detail = CONCERNS.find(item => item.id === action.concern)?.label;
  } else if (action.type === 'rating') {
    id = action.id; label = id === 'before' ? 'Your starting check-in' : `Round ${id.replace('after-', '')} check-in`;
    detail = Number.isInteger(action.value) && action.value >= 0 && action.value <= 10 ? `${action.value} / 10` : null;
  } else if (action.type === 'point' && Number.isInteger(action.round) && action.round > 0 && !action.skipped) {
    const point = TAPPING_POINTS.find(item => item.id === action.point);
    if (!point) return events;
    id = `round-${action.round}-${point.id}`; label = `Round ${action.round} guide · ${point.name}`;
    detail = `Guidance elapsed. ${TAPPING_ARTWORK[point.id].placement}`;
  } else if (action.type === 'cue') {
    id = 'cue'; label = 'Your saved cue'; detail = action.value?.trim();
  } else return events;
  if (!detail) return events.filter(item => item.id !== id);
  const event = { id, label, detail };
  return events.some(item => item.id === id) ? events.map(item => item.id === id ? event : item) : [...events, event];
}
