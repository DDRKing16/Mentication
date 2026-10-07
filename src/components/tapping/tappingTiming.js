import manifest from './tappingAudioManifest.json';

export function tappingPlan(pointId,concern,spacious=false) {
  const placement=Math.ceil(manifest['place-'+pointId].duration)+(spacious?2:1);
  const setupGap=Math.max(7,Math.ceil(manifest[concern+'-setup'].duration)+2);
  const beats=pointId==='hand'&&concern!=='grounding'?3+setupGap*3:spacious?12:8;
  return {placement,beats,total:placement+beats,setupGap};
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
