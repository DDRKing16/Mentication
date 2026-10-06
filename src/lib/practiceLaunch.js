// A suggestion/history can select a practice, never answer today's ratings.
export function practiceLaunchEntry(practice, {audio='no'}={}) {
  return {prebuilt:practice.id!=='happyBump',pathway:[practice.id],direction:practice.primaryDirection || practice.directions?.[0] || 'calm',directionLabel:practice.name,intensity:null,distress:null,goal_baseline:null,whereFelt:practice.targets?.includes('body')?'body':'thoughts',timeMin:practice.durationMin,audio};
}
export function suggestionLaunchEntry(suggestion) {
  return {prebuilt:!suggestion.requiresCheckIn,pathway:[...(suggestion.pathway||[])],direction:suggestion.direction,directionLabel:suggestion.title,intensity:null,distress:null,goal_baseline:null,whereFelt:'both',timeMin:suggestion.min,audio:'yes',movement:'seated'};
}
export function repeatLaunchEntry(session) {
  return {prebuilt:true,pathway:[...(session.pathway||[])],direction:session.direction||session.state,directionLabel:session.direction_label||session.state_label,intensity:null,distress:null,goal_baseline:null,whereFelt:session.where_felt,timeMin:session.time_min,audio:session.audio,movement:session.movement};
}
