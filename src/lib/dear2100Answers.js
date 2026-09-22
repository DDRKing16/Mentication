// Dear 2100 — the real captured state for the flow. Every SuggestionField/
// TextArea/Pill selection in the ported design writes into this shape
// instead of the illustrative "learn to play piano" placeholder copy from
// the locked mock (see INTEGRATION_GUIDE.md §9).

export function createInitialDear2100Answers() {
  return {
    goal: '',
    barriers: { selected: [], extra: '', triedBefore: null, triedWhat: '' },
    selfTalk: '',
    watchers: null,
    verdictTab: 'Audacity',
    verdictAnswers: { Audacity: '', Capability: '', Practicality: '' },
    bodyFeeling: null,
    giveUp: null,
    successFeeling: '',
    fearChain: ['', '', '', ''],
    voiceSource: '',
    lifeNow: '',
    future20: { avoidPicks: [], actPicks: [], preferred: 'act' },
    radicalAcceptanceChoice: 'B',
    safetyBehavior: '',
    valuesChosen: [],
    valuesCustomByValue: {},
    toolkitTab: '1 · Notice',
    pathwayBehavior: '',
    actionContext: { time: '15–30 min', money: 'A little', commitments: 'Work' },
    actionPlan: '',
    commit: { when: 'Today', timeOfDay: 'Afternoon', reward: '' },
    actionDoneFeeling: '',
    alignmentChoices: [],
    evidence: [],
    pride: '',
    prideScared: 'Yes',
  };
}

export function pushEvidence(answers, text) {
  if (!text || !text.trim()) return answers.evidence;
  const entry = { date: new Date().toISOString(), text: text.trim() };
  return [entry, ...(answers.evidence || [])].slice(0, 50);
}
