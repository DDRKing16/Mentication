/* Pure local-first data rules, shared by the document and regression tests. */
(function (root) {
  const rating = value => Number.isInteger(value) && value >= 0 && value <= 10 ? value : null;
  const question = label => ({
    id: 'good-map-satisfaction-v1',
    question: `Lately, how satisfied are you with ${label}?`,
    min: 0,
    max: 10,
    anchors: ['Not at all', 'Completely'],
    direction: 'higher-is-more-satisfied'
  });
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  function scheduled(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) throw Error('Choose a date and time.');
    const [y, m, d] = date.split('-').map(Number),
      [h, n] = time.split(':').map(Number);
    const result = new Date(y, m - 1, d, h, n, 0, 0);
    if (localDate(result) !== date || result.getHours() !== h || result.getMinutes() !== n) throw Error('That local time does not exist. Choose another time.');
    for (const minutes of [30, 60, 90, 120]) {
      const later = new Date(+result + minutes * 60000);
      if (localDate(later) === date && later.getHours() === h && later.getMinutes() === n) throw Error('That local time occurs twice when clocks change. Choose another time.');
    }
    return result;
  }
  const escapeICS = value => String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const utc = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  function calendar({
    at,
    id,
    now = new Date()
  }) {
    const date = new Date(at);
    if (!Number.isFinite(date.getTime()) || date <= now) throw Error('Choose a future date and time before exporting.');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mentication//Good Map//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${escapeICS(id)}@mentication.local`, `DTSTAMP:${utc(now)}`, `DTSTART:${utc(date)}`, `DTEND:${utc(new Date(+date + 10 * 60000))}`, 'SUMMARY:Your small step', 'DESCRIPTION:Open Mentication to review your private plan.', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Your small step', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
  }
  function outcome({
    id,
    key,
    label,
    before,
    after,
    did,
    helpfulness,
    step,
    now = new Date()
  }) {
    return {
      id,
      key,
      at: now.toISOString(),
      assessment: question(label),
      baseline: rating(before),
      endpoint: rating(after),
      did,
      helpfulness: helpfulness || null,
      step,
      requireGoalReassessment: true
    };
  }
  function appendOnce(records, record) {
    return records.some(x => x.id === record.id) ? records : [...records, record];
  }
  function comparison(before, after) {
    return [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])].map(key => ({
      key,
      before: rating(before?.[key]),
      after: rating(after?.[key]),
      delta: rating(before?.[key]) !== null && rating(after?.[key]) !== null ? after[key] - before[key] : null
    }));
  }
  function write(storage, key, value) {
    const data = JSON.stringify(value);
    storage.setItem(key, data);
    if (storage.getItem(key) !== data) throw Error('The device could not verify this save.');
    return true;
  }
  root.GoodMapModel = {
    rating,
    question,
    localDate,
    scheduled,
    calendar,
    outcome,
    appendOnce,
    comparison,
    write
  };
})(globalThis);
