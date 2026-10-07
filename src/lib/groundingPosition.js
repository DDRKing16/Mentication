const PRESENCE = ['more_present','unchanged','more_unsettled'];
const HELPFULNESS = ['helpful','same','worse','unsure'];
// Only coarse stage/explicit feedback belongs in the existing reset history entry.
export function groundingPosition(value, sessionId) {
  if (!sessionId || value?.sessionId !== sessionId || !Number.isInteger(value.step) || value.step < 0 || value.step > 5 || !Number.isFinite(value.elapsed) || value.elapsed < 0 || value.elapsed > 86400) return null;
  return {sessionId,...(Array.isArray(value.noticed) ? {noticed:[...new Set(value.noticed.filter(index=>Number.isInteger(index)&&index>=0&&index<=5))]} : {}),step:value.step,elapsed:Math.floor(value.elapsed),feedback:value.feedback===true,...(["presence","helpfulness"].includes(value.feedbackStep)?{feedbackStep:value.feedbackStep}:{}),presence:PRESENCE.includes(value.presence)?value.presence:null,helpfulness:HELPFULNESS.includes(value.helpfulness)?value.helpfulness:null};
}
export function writeGroundingPosition(history, value, sessionId) {
  try {
    const position=groundingPosition(value,sessionId),state=history.state;
    if(!position || state?.usr?.reset_session_id!==sessionId)return false;
    history.replaceState({...state,usr:{...state.usr,reset_grounding:position}},'');
    return JSON.stringify(history.state?.usr?.reset_grounding)===JSON.stringify(position);
  } catch {return false;}
}
