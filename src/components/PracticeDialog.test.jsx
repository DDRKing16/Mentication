import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ effects: [], open: vi.fn(), portal: vi.fn(value => value) }));
vi.mock('react', async original => ({ ...(await original()), useRef: value => ({ current: value }), useEffect: effect => mocks.effects.push(effect) }));
vi.mock('react-dom', () => ({ createPortal: mocks.portal }));
vi.mock('@/lib/accessibleDialog', () => ({ openAccessibleDialog: mocks.open }));
import PracticeDialog from './PracticeDialog';

const source = path => readFileSync(path, 'utf8');
beforeEach(() => {
  vi.clearAllMocks(); mocks.effects.length = 0;
  vi.stubGlobal('document', { activeElement: { id: 'opener' }, body: { style: { overflow: 'auto' } } });
});
afterEach(() => vi.unstubAllGlobals());

describe('practice dialog compatibility wiring', () => {
  it.each(['nes-v2-wrap', 'tpl', 'urge-lovable'])('preserves the %s theme outside the isolated app root', theme => {
    const tree = PracticeDialog({ titleId: 'title', theme, className: 'sheet', onClose: vi.fn(), children: <button>Continue</button> });
    expect(mocks.portal).toHaveBeenCalledWith(tree, document.body);
    expect(tree.props.className).toBe(`mcn-modal-layer mcn-practice-layer ${theme}`);
    const dialog = tree.props.children;
    expect(dialog.props).toMatchObject({ className: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'title' });
    const layerNode = {}, dialogNode = {}, cleanup = vi.fn();
    tree.ref.current = layerNode; dialog.ref.current = dialogNode;
    mocks.open.mockReturnValue(cleanup);
    const dispose = mocks.effects[0]();
    expect(mocks.open).toHaveBeenCalledWith(dialogNode, layerNode, expect.objectContaining({ opener: document.activeElement }));
    dispose(); expect(cleanup).toHaveBeenCalledOnce();
  });
  it('routes native cancellation and fallback Escape to the safe dismiss action', () => {
    const onClose = vi.fn(), tree = PracticeDialog({ titleId: 'title', theme: 'tpl', className: 'sheet', onClose });
    mocks.open.mockReturnValue(vi.fn());
    const dispose = mocks.effects[0]();
    const preventDefault = vi.fn();
    tree.props.children.props.onCancel({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce(); expect(onClose).toHaveBeenCalledOnce();
    mocks.open.mock.calls[0][2].onClose(); expect(onClose).toHaveBeenCalledTimes(2);
    dispose();
  });
  it('only dismisses backdrop taps when explicitly enabled', () => {
    for (const dismissBackdrop of [false, true]) {
      const onClose = vi.fn(), tree = PracticeDialog({ titleId: 'title', theme: 'tpl', className: 'sheet', onClose, dismissBackdrop });
      const dialog = tree.props.children, target = {};
      dialog.props.onClick({ target: {}, currentTarget: target });
      expect(onClose).not.toHaveBeenCalled();
      dialog.props.onClick({ target, currentTarget: target });
      expect(onClose).toHaveBeenCalledTimes(dismissBackdrop ? 1 : 0);
    }
  });
  it('migrates all three practice confirmations without direct native-only calls', () => {
    for (const file of ['NextEasiestStepExperience', 'TomorrowParkingExperience', 'UrgeSurfExperience']) {
      const code = source(`src/components/${file}.jsx`);
      expect(code).toContain('<PracticeDialog'); expect(code).not.toContain('.showModal(');
      expect(code).not.toContain('<dialog'); expect(code).toContain('autoFocus');
    }
  });
  it('keeps cancellation non-destructive and explicit pause, resume, discard and stop actions', () => {
    const next = source('src/components/NextEasiestStepExperience.jsx');
    expect(next).toContain('onClose={() => setShowPause(false)} dismissBackdrop');
    expect(next).toContain('Resume Focus'); expect(next).toContain('Back to tasks');
    const parking = source('src/components/TomorrowParkingExperience.jsx');
    expect(parking).toContain('onClose={onCancel}');
    expect(parking).toContain('onLeave={() => finish()} onDiscard={() => { clearDraft(); finish(); }}');
    const urge = source('src/components/UrgeSurfExperience.jsx');
    expect(urge).toContain('onClose={()=>setConfirmExit(false)}');
    expect(urge).toContain('dispatch({ type: "TIMER_PAUSED", nowEpochMs: Date.now() }); pauseNarration(); setConfirmExit(true)');
    expect(urge).toContain('dispatch({ type: "TIMER_RESUMED", nowEpochMs: Date.now() }); resumeNarration(); }}>Keep surfing');
    expect(urge).toContain('dispatch({ type: "TIMER_STOPPED", nowEpochMs: Date.now() })}>End gently');
  });
  it('provides legacy viewport and colour support with scrollable long content', () => {
    const css = source('src/styles/practice-dialog.css');
    expect(css).toContain('height: 100vh; height: 100dvh;');
    expect(css).toContain('@supports not (color: oklch(0.5 0 0))');
    expect(css).toContain('.mcn-practice-layer .tpl-leave { max-height: calc(100vh - 2rem)');
  });
});
