import React from 'react';

const LABELS = { hands: 'Hands & forearms', shoulders: 'Arms & shoulders', face: 'Jaw & face', torso: 'Chest & abdomen', hips: 'Glutes & hips', thighs: 'Thighs', lowerLegs: 'Calves & feet' };

// The route comes from this session's actual filtered steps. Advancing a stage
// is navigation, never evidence that a muscle relaxed or a user felt better.
export function pmrRouteGroups(steps = []) {
  return steps.reduce((groups, step, index) => {
    const previous = groups.at(-1);
    if (previous?.region === step.region) previous.end = index;
    else groups.push({ region: step.region, label: step.region === 'whole' ? index === 0 ? 'Settle in' : 'Rest & return' : LABELS[step.region] || step.title, start: index, end: index });
    return groups;
  }, []);
}

export function PMRGuideChoice({ value, onChange }) {
  return <fieldset className="pmr-guide-choice"><legend>How would you like to follow?</legend><div><button type="button" aria-pressed={value === 'body'} onClick={() => onChange('body')}>Body guide</button><button type="button" aria-pressed={value === 'words'} onClick={() => onChange('words')}>Words only</button></div><p>The same guidance and timing. Change views whenever you like.</p></fieldset>;
}

export default function PMRRoute({ steps, index = 0, skipped = [], preview = false }) {
  const groups = pmrRouteGroups(steps);
  const current = groups.findIndex(group => index >= group.start && index <= group.end);
  const currentGroup = groups[current];
  const regions = groups.filter(group => group.region !== 'whole');
  const next = groups[current + 1];
  const content = <ol className="pmr-route-list">{groups.map((group, position) => <li key={`${group.region}-${group.start}`} aria-current={!preview && current === position ? 'step' : undefined} data-state={preview ? 'planned' : skipped.includes(group.region) ? 'skipped' : position < current ? 'past' : position === current ? 'current' : 'planned'}>
    <span className="pmr-route-marker" aria-hidden="true">{!preview && skipped.includes(group.region) ? '–' : position + 1}</span><span>{group.label}{!preview && <small>{skipped.includes(group.region) ? 'Skipped' : position < current ? 'Moved past' : position === current ? 'Here now' : 'Ahead'}</small>}</span>
  </li>)}</ol>;
  return preview ? <details className="pmr-route pmr-route--preview"><summary><strong>Your route · {regions.length} areas</strong><span className="pmr-route-label">View areas</span></summary>{content}</details> : <details className="pmr-route"><summary><span><strong>{currentGroup?.label || 'Your route'}</strong><small>{next ? `Next: ${next.label}` : 'The end of your chosen route'}</small></span><span className="pmr-route-label">View route</span></summary>{content}<p className="pmr-route-note">This shows where you are in the guide, not how relaxed you are.</p></details>;
}
