import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const platform = vi.hoisted(() => ({ native: false }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => platform.native } }));
import { CheckInQuestion, TaraSupportScreens } from '../components/tara-tactician/TaraSupportScreens';
import { newTaraState } from './taraTacticianState';
beforeEach(() => { platform.native = false; });
const props = { go: () => {}, practise: () => {}, pocket: () => {} };
describe('check-in delivery expectations in the actual product screens', () => {
  it('requires an open browser plan and explains missed check-ins without promising background notifications', () => {
    const html = renderToStaticMarkup(<CheckInQuestion screen="plan-check-ins" state={newTaraState()} {...props} />);
    expect(html).toContain('Keep this plan open to see and answer check-ins.');
    expect(html).toContain('They do not send notifications or run in the background.');
    expect(html).toContain('one overdue check-in is offered');
    expect(html).not.toContain('Phone reminders are queued');
  });
  it('explains consent and closed, backgrounded or locked-phone limitations before a native user chooses reminders', () => {
    platform.native = true;
    const html = renderToStaticMarkup(<CheckInQuestion screen="plan-check-ins" state={newTaraState()} {...props} />);
    expect(html).toContain('Keep this plan open to see and answer check-ins.');
    expect(html).toContain('Optional phone reminders need your permission.');
    expect(html).toContain('We cannot guarantee reminders when the app is closed or backgrounded, or your phone is locked.');
  });
  it('describes confirmed native queue registration without asserting notification delivery', () => {
    platform.native = true;
    const state = newTaraState(); state.checkIns.startedAt = 1; state.checkIns.status = 'scheduled';
    const html = renderToStaticMarkup(<TaraSupportScreens screen="live" state={state} {...props} />);
    expect(html).toContain('Phone reminders are queued. Keep this plan open for check-ins.');
    expect(html).toContain('We cannot guarantee reminders when the app is closed or backgrounded, or your phone is locked.');
    expect(html).toContain('Open this practice again after tapping a notification.');
  });
  it.each(['denied', 'error', 'unverified', 'ended'])('keeps manual check-in and immediate support visible with %s reminder status', status => {
    const state = newTaraState(); state.checkIns.startedAt = 1; state.checkIns.status = status;
    const html = renderToStaticMarkup(<TaraSupportScreens screen="live" state={state} {...props} />);
    expect(html).toContain('Check in now'); expect(html).toContain('I need a break');
    expect(html).toContain('Help me regulate'); expect(html).toContain('I need to leave');
    expect(html).not.toContain('Phone reminders are queued');
  });
});
