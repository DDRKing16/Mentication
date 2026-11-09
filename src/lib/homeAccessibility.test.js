import { describe, expect, it } from 'vitest';
import { ACCESSIBILITY_DEFAULTS } from '../hooks/useAccessibilityPrefs';
import { homeAccessibilityState, saveHomeAccessibilityPreference } from './homeAccessibility';
function storage(initial={}) {const values=new Map(Object.entries(initial));return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
const save=(store,name,value,prefs=ACCESSIBILITY_DEFAULTS)=>saveHomeAccessibilityPreference(name,value,store,prefs);
describe('Home accessibility persistence',()=>{
 it('maps host settings and preserves extra-large text',()=>{expect(homeAccessibilityState({...ACCESSIBILITY_DEFAULTS,highContrast:true},1.3)).toEqual({'large-text':true,'high-contrast':true,'reduce-motion':false,textScale:1.3});expect(homeAccessibilityState(ACCESSIBILITY_DEFAULTS,99).textScale).toBe(1);});
 it('rejects unknown keys and non-boolean input without writes',()=>{const s=storage();expect(save(s,'__proto__',true).ok).toBe(false);expect(save(s,'large-text','true').ok).toBe(false);expect(s.getItem('haven.a11y.v2')).toBeNull();});
 it.each(['high-contrast','reduce-motion'])('persists %s while preserving other preferences',name=>{const s=storage(),r=save(s,name,true,{...ACCESSIBILITY_DEFAULTS,ambientType:'rain'});expect(r.ok).toBe(true);expect(r.preferences[name]).toBe(true);expect(JSON.parse(s.getItem('haven.a11y.v2')).ambientType).toBe('rain');});
 it('works without Object.hasOwn',()=>{const original=Object.hasOwn;let result;try{Object.hasOwn=undefined;result=save(storage(),'high-contrast',true);}finally{Object.hasOwn=original;}expect(result.ok).toBe(true);expect(result.preferences['high-contrast']).toBe(true);});
 it('synchronizes boolean and Settings text scale',()=>{const s=storage({haven_a11y:JSON.stringify({textScale:1.3})});expect(save(s,'large-text',true).preferences.textScale).toBe(1.3);expect(save(s,'large-text',false).preferences.textScale).toBe(1);expect(JSON.parse(s.getItem('haven.a11y.v2')).largeText).toBe(false);expect(save(s,'large-text',true).preferences.textScale).toBe(1.15);});
 it('reports silent no-op writes',()=>{const s=storage();s.setItem=()=>{};expect(save(s,'high-contrast',true).ok).toBe(false);});
 it('rolls back first store when text-scale storage fails',()=>{const prev=JSON.stringify(ACCESSIBILITY_DEFAULTS),s=storage({'haven.a11y.v2':prev}),write=s.setItem;s.setItem=(key,value)=>{if(key==='haven_a11y')throw new Error('quota');write(key,value);};expect(save(s,'large-text',true).ok).toBe(false);expect(s.getItem('haven.a11y.v2')).toBe(prev);expect(s.getItem('haven_a11y')).toBeNull();});
});
