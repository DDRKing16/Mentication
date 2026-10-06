import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {completeOnboarding,hasCompletedOnboarding,resetOnboardingSession} from './onboarding';
import {needsGuidedResetEntry} from './resetFlowConfig';
import {practiceLaunchEntry,suggestionLaunchEntry,repeatLaunchEntry} from './practiceLaunch';
beforeEach(()=>resetOnboardingSession());afterEach(()=>{resetOnboardingSession();vi.unstubAllGlobals();});
describe('fresh and returning entry reliability',()=>{
 it('allows explicit onboarding for this run when storage denies reads and writes',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
  expect(hasCompletedOnboarding()).toBe(false);completeOnboarding();expect(hasCompletedOnboarding()).toBe(true);resetOnboardingSession();expect(hasCompletedOnboarding()).toBe(false);
 });
 it('retains normal persisted onboarding',()=>{
  const data=new Map();vi.stubGlobal('localStorage',{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)});
  completeOnboarding();resetOnboardingSession();expect(hasCompletedOnboarding()).toBe(true);
 });
 it('guides bare, invalid and partial URLs without replacing valid explicit entry',()=>{
  for(const entry of [null,undefined,{}, {direction:'unknown'},{direction:''}])expect(needsGuidedResetEntry(entry)).toBe(true);
  for(const entry of [{direction:'calm'},{direction:'lift'},{immediate:true},{prebuilt:true}])expect(needsGuidedResetEntry(entry)).toBe(false);
 });
 it('suggestions and historical repeats never supply today’s goal or distress ratings',()=>{
  const session={pathway:['factCheck'],intensity_start:8,distress:9,goal_baseline:{value:8},state:'calm',where_felt:'thoughts',time_min:3,audio:'no'};
  const repeat=repeatLaunchEntry(session);expect(repeat.intensity).toBeNull();expect(repeat.distress).toBeNull();expect(repeat.goal_baseline).toBeNull();expect(repeat.pathway).toEqual(session.pathway);expect(repeat.pathway).not.toBe(session.pathway);
  expect(suggestionLaunchEntry({direction:'lift',requiresCheckIn:true,pathway:[],min:6}).prebuilt).toBe(false);
  expect(suggestionLaunchEntry({direction:'calm',requiresCheckIn:false,pathway:['boxV2'],min:6}).intensity).toBeNull();
 });
 it('retains existing practice and quiet entry contracts',()=>{
  expect(practiceLaunchEntry({id:'factCheck',name:'Thought or Fact',primaryDirection:'calm',targets:['thoughts'],durationMin:3})).toMatchObject({prebuilt:true,pathway:['factCheck'],intensity:null,audio:'no'});
  expect(practiceLaunchEntry({id:'happyBump',name:'The Happy Bump',primaryDirection:'lift',durationMin:3}).prebuilt).toBe(false);
 });
});
