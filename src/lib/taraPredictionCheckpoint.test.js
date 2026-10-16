import { describe, it, expect } from 'vitest';
import { newTaraState, editTaraDraft, validateTaraState } from './taraTacticianState';
import { checkpointFor, practiceEvent } from './practiceCheckpoints';
const progress = s => checkpointFor([
  practiceEvent('event','Situation','Conversation'), practiceEvent('challenge','Challenge','Finding words'),
  practiceEvent('forecast','Prediction',s.prediction,s.predictionConfirmed === true),practiceEvent('move','Move','One sentence'),
]);
describe('Tara prediction confirmation',()=>{
 it('retains confirmation on navigation and unchanged edits',()=>{
  const saved={...newTaraState(),prediction:'I might freeze.',predictionEdited:true,predictionConfirmed:true};
  expect(editTaraDraft(saved,{flowScreen:'prediction'}).predictionConfirmed).toBe(true);
  expect(editTaraDraft(saved,{prediction:saved.prediction}).predictionConfirmed).toBe(true);
 });
 it('invalidates changed/cleared words through reload and reconfirms one event only',()=>{
  const saved={...newTaraState(),prediction:'I might freeze.',predictionEdited:true,predictionConfirmed:true};
  expect(progress(saved).count).toBe(4);
  const cleared=editTaraDraft(saved,{prediction:''});
  const typed=editTaraDraft(cleared,{prediction:'They may disagree.'});
  const restored=validateTaraState(JSON.parse(JSON.stringify(typed)));
  expect(restored.prediction).toBe('They may disagree.');
  expect(restored.predictionConfirmed).toBe(false);
  expect(progress(restored).count).toBe(3);
  const confirmed={...restored,predictionConfirmed:true};
  expect(progress(confirmed).count).toBe(4);
  expect(progress({...confirmed,predictionConfirmed:true}).pairs).toBe(2);
 });
});
