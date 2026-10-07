// Versioned, device-only Foundations data. Invalid/newer records are never
// silently overwritten. The v1 plan is read without deleting its original.
globalThis.FoundationsStorage = (() => {
  const keys = {
    draft: 'mentication.foundations.draft.v2',
    plan: 'mentication.foundations.weekly-plan.v2',
    legacy: 'mentication.foundations.weekly-plan.v1',
  };
  const rating = value => Number.isInteger(value) && value >= 1 && value <= 5;
  const text = value => typeof value === 'string' ? value.slice(0, 240) : '';
  const sizes = ['tiny', 'regular', 'repeat'];
  const stages = ['intro', 'scan', 'snapshot', 'choices', 'dose', 'plan', 'cue', 'time', 'saved', 'review', 'review-effort', 'review-help', 'learned', 'finish'];
  function create(storage, domains, items) {
    const validChoice = plan => domains.some(domain => domain.id === plan?.domain && Number.isInteger(plan.action) && !!domain.actions[plan.action]) && sizes.includes(plan?.size);
    const validResponses = responses => Object.fromEntries(items.filter(item => rating(responses?.[item.id])).map(item => [item.id, responses[item.id]]));
    const validReview = review => Object.fromEntries((review?.tried === 1 ? ['tried'] : ['tried', 'effort', 'help']).filter(key => rating(review?.[key])).map(key => [key, review[key]]));
    const completeReview = review => rating(review?.tried) && (review.tried === 1 || (rating(review.effort) && rating(review.help)));
    function plan(value) {
      if (![1, 2].includes(value?.version) || !validChoice(value)) return null;
      return {
        version: 2, id: text(value.id) || `legacy-${text(value.savedAt) || value.domain + '-' + value.action}`,
        domain: value.domain, action: value.action, size: value.size,
        cue: text(value.cue), time: /^\d{2}:\d{2}$/.test(value.time || '') && value.time < '24:00' && value.time.slice(3) < '60' ? value.time : '',
        savedAt: text(value.savedAt), updatedAt: text(value.updatedAt || value.savedAt),
        revision: Number.isInteger(value.revision) && value.revision >= 1 ? value.revision : 1,
        reviews: Array.isArray(value.reviews) ? value.reviews.filter(entry => entry && typeof entry.id === 'string' && completeReview(entry.ratings) && validChoice(entry.plan)).map(entry => ({
          id: text(entry.id), reviewedAt: text(entry.reviewedAt), ratings: validReview(entry.ratings),
          plan: { domain: entry.plan.domain, action: entry.plan.action, size: entry.plan.size, cue: text(entry.plan.cue), time: text(entry.plan.time) },
          decision: ['keep', 'tiny', 'change'].includes(entry.decision) ? entry.decision : 'keep',
        })) : [],
      };
    }
    function draft(value) {
      if (value?.version !== 2 || !value.state || typeof value.state !== 'object') return null;
      const s = value.state, priority = domains.some(d => d.id === s.priority) ? s.priority : null;
      const domain = domains.find(d => d.id === priority);
      return {
        version: 2, screen: stages.includes(value.screen) ? value.screen : 'intro',
        checkpointId: items.some(item => item.id === value.checkpointId) ? value.checkpointId : null,
        checkpointRevised: value.checkpointRevised === true,
        state: {
          q: Math.max(0, Math.min(items.length - 1, Number.isInteger(s.q) ? s.q : 0)),
          responses: validResponses(s.responses), answers: {}, priority,
          selected: domain && Number.isInteger(s.selected) && domain.actions[s.selected] ? s.selected : null,
          selectionDomain: priority,
          dose: sizes.includes(s.dose?.id) ? { id: s.dose.id } : null,
          pendingResponse: Number.isInteger(s.pendingResponse) && s.pendingResponse >= 0 && s.pendingResponse <= 4 ? s.pendingResponse : null,
          cue: text(s.cue), time: /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time || '') ? s.time : '',
          review: validReview(s.review), reviewId: text(s.reviewId),
          planId: text(s.planId), planRevision: Number.isInteger(s.planRevision) ? s.planRevision : 0,
          history: Array.isArray(s.history) ? s.history.filter(name => stages.includes(name)).slice(-40) : [],
        },
      };
    }
    function read(key, normalize) {
      try {
        const raw = storage.getItem(key);
        if (raw === null) return { value: null, error: null };
        const value = normalize(JSON.parse(raw));
        return value ? { value, error: null } : { value: null, error: 'unreadable' };
      } catch { return { value: null, error: 'unavailable' }; }
    }
    function write(key, value, normalize) {
      const existing = read(key, normalize);
      if (existing.error) return false;
      const checked = normalize(value);
      if (!checked) return false;
      try {
        const raw = JSON.stringify(checked);
        storage.setItem(key, raw);
        return storage.getItem(key) === raw;
      } catch { return false; }
    }
    return {
      keys, plan, draft, completeReview,
      readDraft: () => read(keys.draft, draft),
      readPlan: () => {
        const current = read(keys.plan, plan);
        return current.value || current.error ? current : read(keys.legacy, plan);
      },
      writeDraft: value => write(keys.draft, value, draft),
      writePlan: value => write(keys.plan, value, plan),
    };
  }
  return { create, keys };
})();
