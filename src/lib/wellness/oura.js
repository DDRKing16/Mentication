import { cleanSnapshot, validDay } from './providers.js';

// Oura V2 daily_* collections. A date is selected explicitly so a missing score
// stays missing rather than silently mixing yesterday's and today's scores.
export function ouraDailySnapshot({ sleep, readiness, activity }, day, syncedAt) {
  if (!validDay(day)) throw new TypeError('Invalid Oura day');
  const collections = [sleep, readiness, activity];
  if (collections.some(collection => !collection || !Array.isArray(collection.data))) throw new TypeError('Invalid Oura collection');
  const metrics = ['Sleep', 'Readiness', 'Activity'].map((label, index) => {
    const row = collections[index].data.find(record => record.day === day);
    const value = row?.score;
    return { id: label.toLowerCase(), label, unit: 'score', day, value: value === undefined || value === null ? null : value };
  });
  return cleanSnapshot('oura', { syncedAt, metrics });
}
