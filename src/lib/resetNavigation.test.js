import { describe, expect, it } from 'vitest';
import { captureGoalBaseline, hasGoalBaseline } from './goalAssessment';
import { resetNavigationEntry, freshResetEntry, appendResetFlowSnapshot, resetFlowHistorySnapshot } from './resetNavigation';
import { createInitialResetAnswers } from './resetFlowConfig';
import { buildAttemptRecord } from './interventions';

const answers={direction:'calm',intensity:7,goal_baseline:captureGoalBaseline('calm',7),noAudio:true,discreet:true,location:'home',timeMin:5};
describe('coarse reset refresh and new-attempt snapshots', () => {
  it.each(['factCheck','happyBump','boxV2','progressive-muscle-relaxation-v2','urgeSurf','grounding54321V2'])('preserves an explicit baseline while resuming %s', id => {
    const entry={prebuilt:true,pathway:[id],intensity:5};
    const setup=resetNavigationEntry(entry,answers,'pathway',{id:'same-session',startedAt:1000});
    const started=resetNavigationEntry(setup,createInitialResetAnswers(setup),'guiding');
    const restored=createInitialResetAnswers(JSON.parse(JSON.stringify(started)));
    expect(restored.goal_baseline).toEqual(answers.goal_baseline);
    expect(restored.intensity).toBe(7);
    expect(restored.noAudio).toBe(true);
    expect(restored.discreet).toBe(true);
    expect(started).toMatchObject({reset_phase:'guiding',reset_session_id:'same-session',reset_started_at:1000,pathway:[id]});
    expect(hasGoalBaseline(restored)).toBe(true);
  });
  it('does not promote guessed entry intensity to a baseline', () => {
    const snapshot=resetNavigationEntry({prebuilt:true,pathway:['factCheck']},{direction:'reset',intensity:5},'guiding');
    expect(snapshot.goal_baseline).toBeNull();
    expect(hasGoalBaseline(snapshot)).toBe(false);
  });
  it('strips private experience text and outcomes from navigation history', () => {
    const privateFields={thought:'PRIVATE',task:'PRIVATE',transcript:'PRIVATE',outcome:{note:'PRIVATE'},intervention_outcome:{thought:'PRIVATE'}};
    const snapshot=resetNavigationEntry({...privateFields,prebuilt:true,pathway:['factCheck']},{...answers,...privateFields},'guiding');
    expect(JSON.stringify(snapshot)).not.toContain('PRIVATE');
  });
  it('a new attempt clears the previous baseline, rating and session identity', () => {
    const resume=resetNavigationEntry({prebuilt:true,pathway:['boxV2']},answers,'guiding',{id:'old',startedAt:1000});
    const fresh=freshResetEntry(resume,answers);
    expect(fresh).toMatchObject({reset_phase:'questions',intensity:null,distress:null,goal_baseline:null,pathway:['boxV2']});
    expect(fresh.reset_session_id).toBeUndefined();
    expect(fresh.reset_started_at).toBeUndefined();
    expect(hasGoalBaseline(createInitialResetAnswers(fresh))).toBe(false);
  });
  it('an explicit early-stop exit cannot count as a completed pathway', () => {
    const event={exitReason:'exited',completedPercentage:0.3};
    const record=buildAttemptRecord({interventionId:'progressive-muscle-relaxation-v2',exitReason:event.exitReason || 'completed',completedPercentage:event.completedPercentage});
    expect(record.exit_reason).toBe('exited');
    expect([record].filter(attempt=>attempt.exit_reason==='completed')).toHaveLength(0);
  });
});


describe('browser Back and Forward within a reset', () => {
  it('preserves the guiding entry when Back visits the overview and Forward returns', () => {
    let stack = [{phase:'questions',unsureStep:0}];
    stack = appendResetFlowSnapshot(stack,0,{phase:'pathway',unsureStep:0});
    stack = appendResetFlowSnapshot(stack,1,{phase:'guiding',unsureStep:0});
    expect(resetFlowHistorySnapshot(stack,1,{}).phase).toBe('pathway');
    expect(resetFlowHistorySnapshot(stack,2,{}).phase).toBe('guiding');
    expect(stack).toHaveLength(3);
  });
  it('discards forward state only when the user makes a new choice after Back', () => {
    const old = [{phase:'questions'},{phase:'pathway'},{phase:'guiding'},{phase:'goalReassessment'}];
    const next = appendResetFlowSnapshot(old,1,{phase:'questions'});
    expect(next).toEqual([{phase:'questions'},{phase:'pathway'},{phase:'questions'}]);
    expect(old).toHaveLength(4);
  });
  it('restores a persisted entry after refresh when the in-memory stack is absent', () => {
    const stack = [];
    expect(resetFlowHistorySnapshot(stack,1,{reset_phase:'pathway'}).phase).toBe('pathway');
    expect(resetFlowHistorySnapshot(stack,2,{reset_phase:'guiding'}).phase).toBe('guiding');
    expect(resetFlowHistorySnapshot(stack,2,{reset_phase:'unknown'})).toBeNull();
  });
});
