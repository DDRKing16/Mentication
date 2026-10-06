import { COMPARISONS, PREDICTION_RESULTS } from './taraTacticianState';
export function taraReportedResult(record) {
  const factual=PREDICTION_RESULTS.find(([value])=>value===record.predictionResult)?.[1];
  if(factual)return {label:'What you reported',text:factual};
  const historical=COMPARISONS.find(([value])=>value===record.comparison)?.[1];
  return historical ? {label:'Earlier difficulty comparison',text:historical} : null;
}
export function savedWorkMatches(query, fields) {
  const tokens=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text=fields.filter(value=>typeof value==='string').join(' ').toLocaleLowerCase();
  return tokens.every(token=>text.includes(token));
}
export function validSavedDate(value) {
  if(typeof value!=='string' || !value.trim())return null;
  const date=new Date(value);return Number.isNaN(date.getTime())?null:date;
}
