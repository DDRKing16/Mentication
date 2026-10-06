import {describe,expect,it} from 'vitest';
import {appBackTarget} from './appBack';
describe('safe app back',()=>{
  it('uses home for a direct or outside-history entry',()=>{for(const state of [null,{}, {idx:0},{idx:-1},{idx:'1'},{idx:Infinity}])expect(appBackTarget(state)).toBe('/');});
  it('preserves router-created previous entries including after refresh',()=>{expect(appBackTarget({idx:2})).toBe(-1);expect(appBackTarget({idx:1},'/library')).toBe(-1);});
  it('honors a practice-specific fallback',()=>{expect(appBackTarget(null,'/library')).toBe('/library');});
});
