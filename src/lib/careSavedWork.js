import { EXTERNAL_ANCHORS } from './carePracticeDesign';

const LABELS = {
  selfCompassion:['When the critic says','My caring response','One act of care'],
  unhook:['When my mind says','My noticing phrase','Where I return my attention'],
  makeRoom:['The feeling I noticed','A phrase to make room','What I choose with it here'],
};
const words = value => typeof value === 'string' ? value.trim() : '';
/** One presentation contract for the native card and its saved-work preview. */
export function careSavedWorkRows(id,state) {
  if (!Object.hasOwn(LABELS,id) || !state) return [];
  const labels = LABELS[id], rows=[];
  if (words(state.notice)) rows.push({kind:'notice',label:labels[0],value:words(state.notice)});
  if (words(state.perspective) && (id !== 'makeRoom' || state.practiceTaken === true)) rows.push({kind:'response',label:labels[1],value:words(state.perspective)});
  if (Object.hasOwn(EXTERNAL_ANCHORS,state.anchorType)) {
    const fallback={object:'An ordinary object',sound:'A sound in the room',support:'The surface supporting me'};
    rows.push({kind:'anchor',label:'An anchor I chose',value:words(state.anchorText)||fallback[state.anchorType]});
  }
  if (words(state.action) && state.actionStatus !== 'not-now') rows.push({kind:'action',label:`${labels[2]} · ${state.actionStatus === 'done' ? 'Done' : state.actionStatus === 'planned' ? 'Planned' : 'Chosen'}`,value:words(state.action)});
  return rows;
}
