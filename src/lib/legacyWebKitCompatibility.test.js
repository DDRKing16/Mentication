import { afterEach, describe, expect, it, vi } from 'vitest';
import { careBackPatch, careForwardPatch, careScreenProgress, validCareScreen } from './careQuestionFlow';
import { freshCareState } from './carePractices';
import { CARE_SAVED_KEY, deleteCareSaved, readCareSaved, writeCareSaved } from './carePracticeStorage';
import { careSavedWorkRows } from './careSavedWork';
import { confirmedJourneyTakeaway, journeyTakeawayId } from './confirmedJourneyTakeaway';
import { resetCompletionSnapshot } from './resetCompletion';
import { ratedShift } from './sessionEvidence';
import { editTaraDraft, newTaraState, validateTaraState } from './taraTacticianState';
import { pmrTiming } from './pmrSession';
import { pmrRouteGroups } from '../components/pmr/PMRRoute';
import { tappingNarrationDuration } from '../components/tapping/tappingNarration';

vi.mock('./narrationService', () => ({
  getNarration: text => text === 'aligned'
    ? { alignment: [{ start: 0, end: 1 }, { start: 1, end: 4 }] }
    : text === 'empty' ? { alignment: [] } : null,
}));

// Remove only during synchronous application calls, then restore before Vitest
// assertions run. This models iOS 15.0–15.3 without adding runtime polyfills.
function withoutModernBuiltins(run) {
  const hasOwn = Object.getOwnPropertyDescriptor(Object, 'hasOwn');
  const at = Object.getOwnPropertyDescriptor(Array.prototype, 'at');
  try {
    delete Object.hasOwn;
    delete Array.prototype.at;
    return run();
  } finally {
    if (hasOwn) Object.defineProperty(Object, 'hasOwn', hasOwn);
    if (at) Object.defineProperty(Array.prototype, 'at', at);
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('iOS 15.0–15.3 JavaScript compatibility', () => {
  it('keeps care navigation, explicit confirmations and optional history working', () => {
    const results = withoutModernBuiltins(() => ({
      known: validCareScreen('notice'),
      inherited: validCareScreen('toString'),
      forward: careForwardPatch('selfCompassion', freshCareState(), 'notice', 'response', { notice: 'My words' }),
      inheritedNotice: careForwardPatch('selfCompassion', freshCareState(), 'notice', 'response', Object.create({ notice: 'Inherited' })),
      back: careBackPatch('selfCompassion', { careTrail: ['intro', 'notice'] }, 'response'),
      emptyBack: careBackPatch('selfCompassion', { careTrail: [] }, 'response'),
      stoppedBack: careBackPatch('makeRoom', { careTrail: ['anchor', 'outside', 'allow'], anchorType: 'support', allowance: null }, 'orient'),
      progress: careScreenProgress('selfCompassion', { careTrail: ['before', 'notice'] }, 'options'),
      absentProgress: [undefined, null, []].map(careTrail => careScreenProgress('selfCompassion', { careTrail }, 'orient')),
    }));
    expect(results.known).toBe(true);
    expect(results.inherited).toBe(false);
    expect(results.forward).toMatchObject({ notice: 'My words', noticeConfirmed: true, careTrail: ['notice'] });
    expect(results.inheritedNotice.noticeConfirmed).toBeUndefined();
    expect(results.back).toMatchObject({ careScreen: 'notice', careTrail: ['intro'] });
    expect(results.emptyBack.careScreen).toBe('notice');
    expect(results.stoppedBack).toMatchObject({ careScreen: 'outside', careTrail: ['anchor'] });
    expect(results.progress).toBe(1.75);
    expect(results.absentProgress).toEqual([0, 0, 0]);
  });

  it('saves, reads and confirms deletion of care cards', () => {
    const data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    });
    const state = { ...freshCareState(), notice: 'My words' };
    const results = withoutModernBuiltins(() => {
      const saved = writeCareSaved('unhook', state);
      const read = readCareSaved('unhook');
      const deleted = deleteCareSaved('unhook');
      return { saved, read, deleted, missing: readCareSaved('unhook') };
    });
    expect(results).toMatchObject({ saved: true, read: { notice: 'My words' }, deleted: true, missing: null });
    expect(data.get(CARE_SAVED_KEY)).toBe('{}');
  });

  it('preserves saved work and takeaway allowlists without inherited properties', () => {
    const results = withoutModernBuiltins(() => ({
      rows: careSavedWorkRows('makeRoom', { notice: 'Worry', anchorType: 'object', anchorText: 'Blue cup' }),
      unknownRows: careSavedWorkRows('toString', { notice: 'Worry' }),
      pmr: confirmedJourneyTakeaway('progressive-muscle-relaxation-v2', { type: 'pmr', skippedRegions: ['hands', 'toString'], tensionResponse: 'same' }),
      grounding: confirmedJourneyTakeaway('grounding54321V2', { presence: 'unchanged' }),
      inheritedAction: confirmedJourneyTakeaway('urgeSurf', { action: 'toString' }),
      takeawayId: journeyTakeawayId('urgeSurf', { usr: { reset_session_id: 'session-1234567890', reset_phase: 'done', pathway: ['urgeSurf'] } }),
    }));
    expect(results.rows.map(row => row.value)).toEqual(['Worry', 'Blue cup']);
    expect(results.unknownRows).toEqual([]);
    expect(results.pmr).toBe('Areas I chose to skip: hands.\nMy tension check-in: About the same.');
    expect(results.grounding).toBe('My grounding feedback: Unchanged.');
    expect(results.inheritedAction).toBe('');
    expect(results.takeawayId).toBe('reset:session-1234567890:urgeSurf');
  });

  it('retains reset metadata and rejects invalid explicit baseline evidence', () => {
    const event = { interventionId: 'factCheck', action: 'completed' };
    const results = withoutModernBuiltins(() => ({
      absent: resetCompletionSnapshot({ event }, 'factCheck'),
      invalid: resetCompletionSnapshot({ event, goalAssessment: null }, 'factCheck'),
      legacyShift: ratedShift({ intensity_start: 8, intensity_end: 6, direction: 'reset' }),
      invalidShift: ratedShift({ intensity_start: 8, intensity_end: 6, direction: 'reset', goal_baseline: null }),
    }));
    expect(results.absent.goalAssessmentInvalid).toBeUndefined();
    expect(results.invalid.goalAssessmentInvalid).toBe(true);
    expect(results.legacyShift).toBe(2);
    expect(results.invalidShift).toBeNull();
  });

  it('restores Tara drafts and invalidates only explicit prediction edits', () => {
    const state = { ...newTaraState(), prediction: 'My prediction', predictionConfirmed: true };
    const results = withoutModernBuiltins(() => ({
      restored: validateTaraState(state),
      invalid: validateTaraState({ ...state, flowScreen: 'toString' }),
      edited: editTaraDraft(state, { prediction: 'Changed prediction' }),
      inherited: editTaraDraft(state, Object.create({ prediction: 'Inherited prediction' })),
    }));
    expect(results.restored).toMatchObject({ flowScreen: 'entry', prediction: 'My prediction' });
    expect(results.invalid).toBeNull();
    expect(results.edited.predictionConfirmed).toBe(false);
    expect(results.inherited.predictionConfirmed).toBe(true);
  });

  it('keeps the last alignment and route group, including empty or missing narration', () => {
    const expectedTapping = tappingNarrationDuration('tap');
    const results = withoutModernBuiltins(() => ({
      timing: pmrTiming({ body: 'aligned' }),
      emptyTiming: pmrTiming({ body: 'empty' }),
      missingTiming: pmrTiming({ body: 'missing', holdSec: 3 }),
      groups: pmrRouteGroups([{ region: 'hands' }, { region: 'hands' }, { region: 'shoulders' }]),
      emptyGroups: pmrRouteGroups([]),
      tapping: tappingNarrationDuration('tap'),
      missingTapping: tappingNarrationDuration('missing'),
    }));
    expect(results.timing.duration).toBe(5.45);
    expect(results.emptyTiming.duration).toBe(1);
    expect(results.missingTiming.duration).toBe(3);
    expect(results.groups).toMatchObject([{ region: 'hands', start: 0, end: 1 }, { region: 'shoulders', start: 2, end: 2 }]);
    expect(results.emptyGroups).toEqual([]);
    expect(results.tapping).toBe(expectedTapping);
    expect(results.missingTapping).toBe(0);
  });
});
