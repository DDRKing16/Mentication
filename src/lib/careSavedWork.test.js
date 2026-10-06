import { describe, expect, it } from 'vitest';
import { careSavedWorkRows } from './careSavedWork';
import { freshCareState, restoreCareState } from './carePractices';
import { getBrandAtmosphere } from './interventionBrand';
describe('saved care cards retain only their actual practice content',()=>{
  it('keeps a chosen anchor when the user declines feeling practice and a next step',()=>{
    const state={...freshCareState(),notice:'Worry',anchorType:'object',anchorText:'Synthetic blue cup',actionStatus:'not-now'};
    expect(careSavedWorkRows('makeRoom',state)).toEqual([{kind:'notice',label:'The feeling I noticed',value:'Worry'},{kind:'anchor',label:'An anchor I chose',value:'Synthetic blue cup'}]);
  });
  it('does not show an untried Make Room phrase after stopping; the anchor remains returnable',()=>{
    const state={...freshCareState(),perspective:'Synthetic phrase',anchorType:'sound',anchorText:'Synthetic fan',practiceTaken:false};
    expect(careSavedWorkRows('makeRoom',state)).toEqual([{kind:'anchor',label:'An anchor I chose',value:'Synthetic fan'}]);
    expect(careSavedWorkRows('makeRoom',{...state,practiceTaken:true})).toContainEqual({kind:'response',label:'A phrase to make room',value:'Synthetic phrase'});
  });
  it('labels a planned action as planned without turning it into completion',()=>{
    const planned={...freshCareState(),action:'Synthetic next step',actionStatus:'planned'};
    expect(careSavedWorkRows('unhook',planned)[0].label).toBe('Where I return my attention · Planned');
    expect(careSavedWorkRows('unhook',{...planned,actionStatus:'done'})[0].label).toBe('Where I return my attention · Done');
    expect(careSavedWorkRows('unhook',{...planned,actionStatus:'not-now'})).toEqual([]);
  });
  it('preserves user words and uses a generic cue only for a known selected anchor',()=>{
    expect(careSavedWorkRows('unhook',{...freshCareState(),notice:'Synthetic thought',perspective:'Synthetic noticing phrase',anchorType:'support'}).map(row=>row.value))
      .toEqual(['Synthetic thought','Synthetic noticing phrase','The surface supporting me']);
    expect(careSavedWorkRows('unhook',{...freshCareState(),anchorType:null,anchorText:'An unchosen cue'})).toEqual([]);
  });
  it('does not invent a card from scores, practice counters or empty fields',()=>{
    expect(careSavedWorkRows('selfCompassion',{...freshCareState(),before:10,after:0,clicks:99,practiceTaken:true})).toEqual([]);
    expect(careSavedWorkRows('unknown',{notice:'Private words'})).toEqual([]);
    expect(careSavedWorkRows('makeRoom',{notice:'  ',anchorType:'invalid',action:1})).toEqual([]);
  });
  it('keeps the same content after the existing saved-state restore',()=>{
    const source={...freshCareState(),notice:'Synthetic feeling',anchorType:'object',anchorText:'Synthetic tree',action:'Synthetic action',actionStatus:'planned',practiceTaken:false,perspective:'Untried phrase'};
    expect(careSavedWorkRows('makeRoom',restoreCareState(source))).toEqual(careSavedWorkRows('makeRoom',source));
  });
  it('shared presentation uses the exact established native care backgrounds',()=>{
    expect(getBrandAtmosphere('selfCompassion').background).toBe('#251f23');
    expect(getBrandAtmosphere('unhook').background).toBe('#0b182b');
    expect(getBrandAtmosphere('makeRoom').background).toBe('#132c29');
  });
});
