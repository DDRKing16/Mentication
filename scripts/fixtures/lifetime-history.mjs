// Synthetic-only fixtures shared by storage and rendered regression checks.
export const HISTORY_NOW = '2026-11-16T12:00:00Z';
export function practice(id, created_date, completed = true) {
  return { id, created_date, direction: 'calm', intensity_start: 7, intensity_end: 4,
    pathway: ['box'], completed_pathway: completed ? ['box'] : [],
    attempts: completed ? [{ intervention_id: 'box', exit_reason: 'completed', completed_percentage: 100 }] : [] };
}
export function dailyPractices(days = 200, perDay = 3) {
  return Array.from({ length: days * perDay }, (_, index) => practice(`day-${index}`,
    new Date(Date.parse(HISTORY_NOW) - Math.floor(index / perDay) * 86400000 - (index % perDay) * 60000).toISOString()));
}
export function olderPalaceHistory() {
  return [...Array.from({length:500},(_,i)=>practice(`empty-${i}`,new Date(Date.parse(HISTORY_NOW)-i*60000).toISOString(),false)),
    ...Array.from({length:28},(_,i)=>practice(`older-${i}`,new Date(Date.parse(HISTORY_NOW)-(i+2)*86400000).toISOString()))];
}
