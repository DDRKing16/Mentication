export const SCENE_ACTIONS = Object.freeze([
  { title:'Move, just a little', primary:'Move to a different spot in the room.', alternative:'Stay where you are and gently change your position, if comfortable.', done:'I moved', alternateDone:'I changed position' },
  { title:'Get some water', primary:'If water is available and suitable for you, take a few comfortable sips.', alternative:'Pause and notice an object near you. You do not need to drink anything.', done:'I had some water', alternateDone:'I noticed an object' },
  { title:'A different view', primary:'If it is safe and practical, spend a moment outside.', alternative:'Stay indoors and look toward a window or another part of the room.', done:'I spent time outside', alternateDone:'I changed my view' },
  { title:'A small connection', primary:'If you want to, send a short message to someone you trust.', alternative:'Keep it private: think of or write one kind sentence for yourself.', done:'I sent a message', alternateDone:'I chose kind words' },
  { title:'Find a quiet corner', primary:'Choose a comfortable place to sit or rest.', alternative:'Stay where you are and ease one small discomfort, if you can.', done:'I got comfortable', alternateDone:'I eased one discomfort' },
  { title:'Plan one thing', primary:'Choose one small thing you would like to do later.', alternative:'Leave planning for now and give yourself a moment to rest.', done:'I chose a plan', alternateDone:'I took a moment' },
]);
export function restoreSceneSession(saved) {
  const step=Number.isInteger(saved?.step) ? Math.max(0,Math.min(7,saved.step)) : 0;
  const actions={};
  for(let i=1;i<=6;i++) {
    const a=saved?.actions?.[i];
    if(a && ['primary','alternative'].includes(a.choice) && ['chosen','done','skipped'].includes(a.status)) actions[i]={choice:a.choice,status:a.status};
  }
  return {step,actions,helpfulness:['helpful','same','worse','unsure'].includes(saved?.helpfulness)?saved.helpfulness:null};
}
export function sceneAction(session,step,action) {
  if(step<1||step>6) return session;
  const previous=session.actions[step] || {choice:'primary',status:'chosen'};
  const next=action==='primary'||action==='alternative' ? {choice:action,status:'chosen'} : {...previous,status:action==='done'?'done':action==='skip'?'skipped':'chosen'};
  return {...session,actions:{...session.actions,[step]:next}};
}
export function sceneOutcome(session) {
  const done=Object.values(session.actions).filter(a=>a.status==='done').length;
  const skipped=Object.values(session.actions).filter(a=>a.status==='skipped').length;
  return {actions:session.actions,confirmedActions:done,skippedActions:skipped};
}
