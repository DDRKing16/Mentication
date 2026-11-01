// Capability catalogue, not a list of working connections. Adapters are opt-in.
export const WELLNESS_PROVIDERS = Object.freeze([
  { id: 'oura', name: 'Oura', detail: 'Sleep, Readiness and Activity scores. Secure connection setup required.', consent: 'Read your daily Sleep, Readiness and Activity summaries from Oura to display on Home. No email, heart rate history or personal profile is requested.' },
  { id: 'apple-health', name: 'Apple Health', detail: 'A future iPhone connection for data shared by compatible apps. Native setup required.', consent: 'Read only the health data types you choose on your iPhone.' },
  { id: 'health-connect', name: 'Health Connect', detail: 'A future Android connection for data shared by compatible apps. Android app required.', consent: 'Read only the health data types you choose on your Android device.' },
  { id: 'google-health', name: 'Google Health / Fitbit', detail: 'Requires Google Health API setup and approval. Not connected in this version.', consent: 'Read only the daily health data types you approve in Google.' },
  { id: 'whoop', name: 'WHOOP', detail: 'Recovery, Sleep performance and Strain need a separate approved connection.', consent: 'Read your Recovery, Sleep and cycle summaries from WHOOP.' },
  { id: 'garmin', name: 'Garmin', detail: 'Requires Garmin business API access. Not connected in this version.', consent: 'Read only the health summaries you approve in Garmin.' },
]);
export function providerById(id) { return WELLNESS_PROVIDERS.find(provider => provider.id === id); }

export function validDay(day) {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
}

// Scores and measurements retain their source, units and own measurement day.
// No cross-provider "readiness" conversion or changes to recommendations.
export function cleanSnapshot(provider, input) {
  if (!providerById(provider) || !input || !Array.isArray(input.metrics) ||
      typeof input.syncedAt !== 'string' || !Number.isFinite(Date.parse(input.syncedAt))) {
    throw new TypeError('Invalid wellness summary');
  }
  const metrics = input.metrics.slice(0, 6).map(metric => {
    if (!metric || typeof metric.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(metric.id) ||
        typeof metric.label !== 'string' || !metric.label.trim() || metric.label.length > 40 ||
        !['score', 'percent', 'hours', 'steps', 'bpm', 'ms', 'strain'].includes(metric.unit) ||
        !validDay(metric.day) || !(metric.value === null || Number.isFinite(metric.value) && metric.value >= 0) ||
        (['score', 'percent'].includes(metric.unit) && metric.value > 100) ||
        (metric.unit === 'strain' && metric.value > 21)) throw new TypeError('Invalid wellness metric');
    return { provider, id: metric.id, label: metric.label, value: metric.value, unit: metric.unit, day: metric.day };
  });
  return { provider, syncedAt: new Date(input.syncedAt).toISOString(), metrics };
}
