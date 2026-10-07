import { tappingNarrationDuration } from './tappingNarration';
import { TAPPING_BEAT_MS, TAPPING_SPACIOUS_BEAT_MS } from './tappingGuidance';

export function tappingPlan(pointId,concern,spacious=false) {
  const placement=Math.ceil(tappingNarrationDuration('place-'+pointId))+(spacious?2:1);
  const setupGap=Math.max(7,Math.ceil(tappingNarrationDuration(concern+'-setup'))+2);
  const bodySeconds=Math.max(6,Math.ceil(3+tappingNarrationDuration(concern+'-reminder')+1));
  const tappingSeconds=pointId==='hand'&&concern!=='grounding'?3+setupGap*3:bodySeconds+(spacious?2:0);
  const beatMs=spacious?TAPPING_SPACIOUS_BEAT_MS:TAPPING_BEAT_MS;
  const beats=Math.ceil(tappingSeconds*1000/beatMs);
  return {placement,beats,tappingSeconds,total:placement+tappingSeconds,setupGap,beatMs,contactMs:beatMs*.4};
}
export function narrationForTick(pointId,concern,second,plan) {
  if(second===0)return 'place-'+pointId;
  const beat=second-plan.placement;
  if(beat===0)return 'tap';
  if(pointId==='hand'&&concern!=='grounding') {
    if([3,3+plan.setupGap,3+plan.setupGap*2].includes(beat))return concern+'-setup';
  } else if(beat===3)return concern+'-reminder';
  return null;
}
