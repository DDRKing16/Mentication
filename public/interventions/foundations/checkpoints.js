// Reflections describe confirmed answers, never a health score or improvement.
// Shared by the standalone document and its tests; no storage or side effects.
globalThis.FoundationsCheckpoints = (() => {
  const ratingLabels = [
    'mostly working against you', 'under pressure', 'mixed',
    'mostly supporting you', 'strong and steady',
  ];
  const subjects = {
    sleep: ['sleep timing', 'restfulness'],
    nutrition: ['eating regularly', 'energy from food and water'],
    movement: ['movement frequency', 'fitting movement in'],
    recovery: ['downtime', 'recovery after demanding days'],
    structure: ['manageable days', 'knowing what to do next'],
    activation: ['getting started', 'doing useful or enjoyable things'],
    support: ['feeling supported', 'reaching someone when needed'],
    stability: ['day-to-day stability', 'limiting unsettling patterns'],
  };
  const isRating = value => Number.isInteger(value) && value >= 1 && value <= 5;

  function describe({ items, responses, lastId, revised = false }) {
    const answered = items.map(item => isRating(responses[item.id]));
    const count = answered.filter(Boolean).length;
    const index = items.findIndex(item => item.id === lastId);
    const item = items[index];
    const value = item && responses[item.id];
    const base = { answered, count, total: items.length, current: index };
    if (!item || !isRating(value)) {
      return {
        ...base, current: -1, title: 'Build your picture',
        copy: 'Each answer lights one piece. Each pair in an area reveals a connection.',
        next: 'First: how the basics feel overall.',
      };
    }

    let title = revised ? 'Reflection updated' : 'One piece revealed';
    let copy = item.id === 'overall'
      ? `You rated the basics as ${ratingLabels[value - 1]}. This is your starting point.`
      : `You rated ${subjects[item.domainId][Number(item.id.slice(-1))]} as ${ratingLabels[value - 1]}.`;
    if (item.domainId) {
      const first = responses[item.domainId + '-0'];
      const second = responses[item.domainId + '-1'];
      if (isRating(first) && isRating(second)) {
        const [a, b] = subjects[item.domainId];
        title = revised ? 'Connection updated' : 'Two pieces connected';
        copy = first === second
          ? `You rated ${a} and ${b} alike: ${ratingLabels[first - 1]}.`
          : `You rated ${first > second ? a : b} higher than ${first > second ? b : a}. Both answers belong in your picture.`;
      }
    }
    // Overall is a real answer too: reveal each even pair, including the
    // first pair before a domain has both of its own answers.
    if (count % 2 === 0 && title === (revised ? 'Reflection updated' : 'One piece revealed')) {
      const pair = items.filter(entry => isRating(responses[entry.id])).slice(-2);
      title = revised ? 'Connection updated' : 'Two pieces connected';
      copy = pair.map(entry => {
        const subject = entry.id === 'overall' ? 'the basics overall' : subjects[entry.domainId][Number(entry.id.slice(-1))];
        return `${subject}: ${ratingLabels[responses[entry.id] - 1]}`;
      }).join(' · ') + '.';
    }
    const nextItem = items[index + 1];
    return {
      ...base, title, copy,
      next: nextItem ? `Next: ${nextItem.context.toLowerCase()}.` : 'Next: bring your answers together and choose a focus.',
    };
  }
  return { describe };
})();
