import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ location:{pathname:'/profile',key:'initial'}, completed:true, ref:{current:null} }));
vi.mock('react', async original => ({ ...(await original()), useRef:()=>state.ref }));
vi.mock('react-router-dom', () => ({ useLocation:()=>state.location, Navigate:'navigate' }));
vi.mock('@/lib/onboarding', () => ({ hasCompletedOnboarding:()=>state.completed }));
import OnboardingGate from './OnboardingGate';
const render = () => OnboardingGate({children:'admitted content'});
beforeEach(()=>{state.location={pathname:'/profile',key:'initial'};state.completed=true;state.ref={current:null};});
it('retains only the already-admitted Profile visit after erasure resets onboarding',()=>{
  expect(render()).toBe('admitted content'); state.completed=false;
  expect(render()).toBe('admitted content');
  state.location={pathname:'/settings',key:'next'};
  expect(render().props.to).toBe('/welcome');
  state.location={pathname:'/profile',key:'initial'};
  expect(render().props.to).toBe('/welcome');
});
it('does not admit a fresh Profile visit before onboarding',()=>{
  state.completed=false;expect(render().props.to).toBe('/welcome');
});
it('reapplies the gate on reload or a new Profile history entry',()=>{
  expect(render()).toBe('admitted content');state.completed=false;
  state.location={pathname:'/profile',key:'another'};expect(render().props.to).toBe('/welcome');
  state.location={pathname:'/profile',key:'initial'};state.ref={current:null};expect(render().props.to).toBe('/welcome');
});
it('does not hold any other tab open when onboarding is reset',()=>{
  state.location={pathname:'/library',key:'library'};expect(render()).toBe('admitted content');
  state.completed=false;expect(render().props.to).toBe('/welcome');
});
