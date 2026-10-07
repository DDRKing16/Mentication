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
  it('explains native background scheduling, consent, discreet content and settings before choosing reminders', () => {
    platform.native = true;
    const html = renderToStaticMarkup(<CheckInQuestion screen="plan-check-ins" state={newTaraState()} {...props} />);
    expect(html).toContain('Optional phone reminders need your permission.');
    expect(html).toContain('Your phone can show them while locked or with Mentication closed.');
    expect(html).toContain('Focus and notification settings may delay or hide them.');
    expect(html).toContain('The reminder shows no private plan words.');
    expect(html).toContain('If permission is declined, you can still check in here.');
  });
  it('describes confirmed native queue registration without asserting notification delivery', () => {
    platform.native = true;
    const state = newTaraState(); state.checkIns.startedAt = 1; state.checkIns.status = 'scheduled';
    const html = renderToStaticMarkup(<TaraSupportScreens screen="live" state={state} {...props} />);
    expect(html).toContain('Phone reminders are scheduled for this window, including while your phone is locked or Mentication is closed.');
    expect(html).toContain('Focus and notification settings may delay or hide them.');
    expect(html).toContain('Tap a reminder to open this plan’s check-in.');
    expect(html).not.toContain('Keep this plan open for check-ins.');
  });
  it('does not claim native delivery for a device plan restored in a browser', () => {
    const state = newTaraState(); state.checkIns.startedAt = 1; state.checkIns.status = 'scheduled';
    const html = renderToStaticMarkup(<TaraSupportScreens screen="live" state={state} {...props} />);
    expect(html).toContain('Phone check-ins are not confirmed.');
    expect(html).not.toContain('Phone reminders are scheduled');
  });
  it.each(['denied', 'error', 'unverified', 'ended'])('keeps manual check-in and immediate support visible with %s reminder status', status => {
    const state = newTaraState(); state.checkIns.startedAt = 1; state.checkIns.status = status;
    const html = renderToStaticMarkup(<TaraSupportScreens screen="live" state={state} {...props} />);
    expect(html).toContain('Check in now'); expect(html).toContain('I need a break');
    expect(html).toContain('Help me regulate'); expect(html).toContain('I need to leave');
    expect(html).not.toContain('Phone reminders are queued');
  });
});
