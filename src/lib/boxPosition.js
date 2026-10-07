// Device-tab navigation state contains only actual timing and coarse feedback.
export function boxPosition(value, sessionId) {
  if (!sessionId || value?.sessionId !== sessionId || !Number.isInteger(value.step) || value.step < 0 || value.step > 3 || !Number.isFinite(value.elapsed) || value.elapsed < 0 || value.elapsed > 86400) return null;
  return {sessionId,step:value.step,elapsed:Math.floor(value.elapsed),...( ['helpful','same','unsure','worse'].includes(value.helpfulness) ? {helpfulness:value.helpfulness} : {}),clockElapsed:Number.isFinite(value.clockElapsed)?Math.max(0,Math.min(64000,value.clockElapsed)):0,
    ...(value.feedback && ['completed','exited','skipped'].includes(value.feedback.exitReason) && Number.isFinite(value.feedback.completedPercentage) ? {feedback:{exitReason:value.feedback.exitReason,completedPercentage:Math.max(0,Math.min(1,value.feedback.completedPercentage))}} : {})};
}
export function writeBoxPosition(history, value, sessionId) {
  try {
    const position=boxPosition(value,sessionId),state=history.state;
    if (!position || state?.usr?.reset_session_id !== sessionId) return false;
    history.replaceState({...state,usr:{...state.usr,reset_box:position}},'');
    return JSON.stringify(history.state?.usr?.reset_box)===JSON.stringify(position);
  } catch { return false; }
}
