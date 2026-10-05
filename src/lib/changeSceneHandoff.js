import { captureGoalBaseline } from './goalAssessment.js';
import { getIntervention, suggestAdaptiveAlternative } from './interventions.js';
import { hardEligibleV3 } from './recommendationV3.js';
const answered=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=10;
export function sceneHandoff(session,request,checkin) {
  if(!session?.pathway?.includes('changeScene') || !['happyBump','dear2100','different'].includes(request))return null;
  if(!answered(checkin?.mood)||!answered(checkin?.distress)||!checkin.confirmed)return null;
  const context=session.context_snapshot || {};
  if(context.immediate||context.acute||context.disconnected||['acute','immediate-danger','disconnected'].includes(context.subtype))return null;
  if(!['home','work','public'].includes(checkin.location)||![2,3,5,10,15,20].includes(checkin.timeMin))return null;
  const answers={...context,direction:'lift',directionLabel:'Lift',intensity:checkin.mood,distress:checkin.distress,location:checkin.location,timeMin:checkin.timeMin,goal_baseline:captureGoalBaseline('lift',checkin.mood)};
  // Longer reflection keeps the established Happy Bump → fresh check-in gate.
  // This step never treats completion of Change Scene as completion of Happy Bump.
  if(request==='dear2100'&&(checkin.location!=='home'||checkin.timeMin<20||!checkin.longerJourney))return null;
  const next=request==='different'?suggestAdaptiveAlternative('changeScene','unsure',answers):getIntervention('happyBump');
  if(!next||next.mechanism===getIntervention('changeScene').mechanism||!hardEligibleV3(next,answers))return null;
  return {intervention:next,entry:{...answers,prebuilt:true,pathway:[next.id]}};
}
