import {SCENE_ACTIONS} from './changeSceneSession';
import {JOURNEY_EXPERIENCES} from './journeyExperience';

const text = value => typeof value === 'string' ? value.trim().slice(0,300) : '';
const rating = value => Number.isInteger(value) && value >= 0 && value <= 10;
const URGE_ACTIONS = {leave:'Create distance from the trigger, if safe.',substitute:'Choose a safe substitute for the next few minutes.',support:'Reach out for support.'};
const PMR_REGIONS = {hands:'hands',shoulders:'shoulders',face:'face',torso:'torso',hips:'hips',thighs:'thighs',lowerLegs:'lower legs'};
const PMR_RESPONSES = {less_tension:'Less tension',same:'About the same',easier_to_notice:'Easier to notice',more_uncomfortable:'More uncomfortable'};

// Candidate wording from the user's actual choices/answers. It is never a
// saved note until the user chooses Save, and never infers benefit/completion.
export function confirmedJourneyTakeaway(id, outcome) {
  if (!outcome || typeof outcome !== 'object') return '';
  const lines=[];
  if (id === 'changeScene' && outcome.actions && typeof outcome.actions === 'object') {
    const confirmed=SCENE_ACTIONS.flatMap((action,index)=>{
      const chosen=outcome.actions[index+1];
      if(chosen?.status !== 'done' || !['primary','alternative'].includes(chosen.choice)) return [];
      return [chosen.choice === 'alternative' ? action.alternateDone : action.done];
    });
    if(confirmed.length) lines.push('Changes I marked as tried:',...confirmed.map(value=>`• ${value}`));
  }
  if(id === 'progressive-muscle-relaxation-v2' && outcome.type === 'pmr') {
    if(['release','contrast'].includes(outcome.mode)) lines.push(`My PMR setup: ${outcome.mode === 'release' ? 'release only' : 'gentle tense and release'}${['short','full'].includes(outcome.length) ? ` · ${outcome.length} session` : ''}.`);
    const skipped=Array.isArray(outcome.skippedRegions) ? [...new Set(outcome.skippedRegions.filter(key=>Object.hasOwn(PMR_REGIONS,key)))].map(key=>PMR_REGIONS[key]) : [];
    if(skipped.length) lines.push(`Areas I chose to skip: ${skipped.join(', ')}.`);
    if(Object.hasOwn(PMR_RESPONSES,outcome.tensionResponse)) lines.push(`My tension check-in: ${PMR_RESPONSES[outcome.tensionResponse]}.`);
  }
  if(id === 'grounding54321V2') {
    const responses={more_present:'More present',unchanged:'Unchanged',more_unsettled:'More unsettled'};
    if(Object.hasOwn(responses,outcome.presence)) lines.push(`My grounding feedback: ${responses[outcome.presence]}.`);
  }
  if(id === 'urgeSurf' && Object.hasOwn(URGE_ACTIONS,outcome.action)) lines.push(`My chosen next step: ${URGE_ACTIONS[outcome.action]}`);
  if(id === 'eftTapping') {
    if(['eft','grounding'].includes(outcome.mode)) lines.push(`My tapping choice: ${outcome.mode === 'grounding' ? 'grounding, without focusing on a concern' : 'a gentle EFT-style round'}.`);
    if(Number.isInteger(outcome.skippedPoints) && outcome.skippedPoints > 0 && outcome.skippedPoints <= 1000) lines.push(`Points I chose to skip: ${outcome.skippedPoints}.`);
    if(outcome.ratingQuestion === 'How intense is the discomfort right now?' && outcome.ratingMin === 0 && outcome.ratingMax === 10) {
      if(rating(outcome.before) || rating(outcome.after)) lines.push(outcome.ratingQuestion,
        [rating(outcome.before) ? `Before: ${outcome.before}/10` : '',rating(outcome.after) ? `Now: ${outcome.after}/10` : ''].filter(Boolean).join(' · '));
    }
  }
  return lines.join('\n');
}

export function happyBumpTakeaway(state) {
  const activity=text(state?.nextActivity), step=text(state?.areaAction);
  const lines=[];
  if(activity) lines.push(`My chosen next activity: ${activity}`);
  else if(step) lines.push(`A small step I chose: ${step}`);
  if(activity && state.nextMode === 'productive') {
    if(text(state.pairing)) lines.push(`Pair it with: ${text(state.pairing)}`);
    if(text(state.reward)) lines.push(`Afterward: ${text(state.reward)}`);
  }
  const comfort=text(state?.customComfortIdea) || text(state?.comfortIdea);
  if(comfort) lines.push(`A comfort idea I chose: ${comfort}`);
  return lines.join('\n');
}

// One deliberately saved note per practice in this reset. Other sessions and
// standalone/manual notes retain separate IDs. No private text enters the ID.
export function journeyTakeawayId(id, navigationState) {
  const entry=navigationState?.usr;
  const session=entry?.reset_session_id;
  if(!Object.hasOwn(JOURNEY_EXPERIENCES,id) || typeof session !== 'string'
    || !/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|session-\d{10,16})$/i.test(session)
    || !['guiding','goalReassessment','reflect','done'].includes(entry.reset_phase)
    || !Array.isArray(entry.pathway) || !entry.pathway.includes(id)) return null;
  return `reset:${session}:${id}`;
}
