import assert from 'node:assert/strict';

// Called by the engineering smoke runner with a clean native/fallback context.
export async function checkJourneyDialogs(page, origin) {
  await page.goto(`${origin}/night-channel`);
  const trigger = page.getByRole('button', { name: 'Another way', exact: true });
  await trigger.waitFor();
  // The real iframe must finish loading its pause acknowledgement handler.
  await page.frameLocator('iframe[title="Night Channel"]').locator('body').waitFor();
  const options = page.locator('.journey-options-dialog');
  const note = page.locator('.journey-note-screen');
  const summary = options.locator('summary');
  const textarea = note.locator('textarea');
  const focused = selector => page.waitForFunction(value => document.activeElement?.matches(value), selector);
  const openOptions = async () => {
    await trigger.click();
    await options.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('.journey-options-dialog')?.contains(document.activeElement));
  };
  const openNote = async () => {
    await summary.click();
    await note.waitFor({ state: 'visible' });
    await page.waitForFunction(() => Boolean(history.state?.journey_note));
    await page.waitForFunction(() => document.querySelector('.journey-note-screen')?.contains(document.activeElement));
  };
  const noteClosed = async () => {
    await note.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => !history.state?.journey_note);
    await focused('.journey-options-dialog summary');
    assert(await options.isVisible(), 'Closing note must retain Options');
  };
  await openOptions();
  let reachedSummary = false;
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Tab');
    const state = await options.evaluate(dialog => ({ inside: dialog.contains(document.activeElement), summary: document.activeElement?.tagName === 'SUMMARY' }));
    assert(state.inside, 'Options Tab must not escape the sheet');
    reachedSummary ||= state.summary;
  }
  assert(reachedSummary, 'Optional note summary must be keyboard reachable');
  const initialIndex = await page.evaluate(() => history.state?.idx);
  await openNote();
  assert.equal(await page.evaluate(() => history.state?.idx), initialIndex + 1, 'Note adds one history entry');
  await textarea.fill('Journey compatibility saved cue');
  await note.getByRole('button', { name: 'Save on this device', exact: true }).click();
  await note.getByRole('status').filter({ hasText: 'Saved on this device.' }).waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.takeaways.v1')).some(value => value.text === 'Journey compatibility saved cue')), true);
  assert.equal(await textarea.evaluate(element => {
    const box = element.getBoundingClientRect();
    return document.elementFromPoint(box.left + box.width / 2, box.top + Math.min(20, box.height / 2)) === element;
  }), true, 'Nested note must be painted above Options');
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    assert(await note.evaluate(dialog => dialog.contains(document.activeElement)), 'Nested focus must stay in the note');
  }
  await note.getByRole('button', { name: 'Back to practice', exact: true }).click();
  await noteClosed();
  await openNote();
  assert.equal(await textarea.inputValue(), 'Journey compatibility saved cue');
  await textarea.fill('Unsaved cue retained while mounted');
  await page.keyboard.press('Escape');
  await noteClosed();
  await options.getByRole('button', { name: 'Return to Night Channel', exact: true }).click();
  await options.waitFor({ state: 'hidden' });
  await focused('.journey-options-button');
  await openOptions(); await openNote();
  assert.equal(await textarea.inputValue(), 'Unsaved cue retained while mounted', 'Options dismissal must not discard the mounted note draft');
  await page.goBack();
  await noteClosed();
  assert.equal(await page.evaluate(() => history.state?.idx), initialIndex, 'Browser Back must not go back twice');
  const modalIsolation = () => page.evaluate(() => ({
    overflow: document.body.style.overflow,
    rootInert: document.querySelector('#root').getAttribute('inert'),
    rootHidden: document.querySelector('#root').getAttribute('aria-hidden'),
    optionsInert: document.querySelector('.journey-options-dialog-layer').getAttribute('inert'),
    optionsHidden: document.querySelector('.journey-options-dialog-layer').getAttribute('aria-hidden'),
    activeFallbacks: document.querySelectorAll('.journey-dialog-layer[data-fallback="true"]').length,
  }));
  const outerIsolation = await modalIsolation();
  const historyLength = await page.evaluate(() => history.length);
  await page.goForward();
  await page.waitForFunction(() => Boolean(history.state?.journey_note));
  assert.equal(await page.evaluate(() => history.state?.idx), initialIndex + 1, 'Forward returns to the existing note entry');
  assert.equal(await note.isVisible(), false, 'Forward alone retains the existing dismissed-note behavior');
  assert(await options.isVisible(), 'Forward must retain the underlying Options sheet');
  assert.deepEqual(await modalIsolation(), outerIsolation, 'Forward must not add hidden-note isolation or scroll locks');
  await openNote();
  assert.equal(await page.evaluate(() => history.length), historyLength, 'Reopening a forwarded note must reuse its history entry');
  assert.equal(await page.evaluate(() => history.state?.idx), initialIndex + 1, 'Reopening must not increment the forwarded entry');
  await note.getByRole('button', { name: 'Back to practice', exact: true }).click();
  await noteClosed();
  assert.equal(await page.evaluate(() => history.state?.idx), initialIndex, 'Reopened forwarded note closes with exactly one Back');
  assert.deepEqual(await modalIsolation(), outerIsolation, 'Closing the forwarded note must release only its own isolation');
  await options.getByRole('button', { name: 'Return to Night Channel', exact: true }).click();
  await options.waitFor({ state: 'hidden' });
  await focused('.journey-options-button');
  assert.equal(await page.locator('#root').getAttribute('inert'), null, 'Closing Options after Forward must restore root interactivity');
  assert.notEqual(await page.locator('#root').getAttribute('aria-hidden'), 'true', 'Closing Options after Forward must restore accessibility');
  assert.notEqual(await page.locator('body').evaluate(element => element.style.overflow), 'hidden', 'Closing Options after Forward must release scroll locks');
  await openOptions(); await openNote();
  await note.getByRole('button', { name: 'Save changes on this device', exact: true }).click();
  await note.getByRole('status').filter({ hasText: 'Saved on this device.' }).waitFor();
  await note.getByRole('button', { name: 'Delete saved note', exact: true }).click();
  assert.equal(await textarea.inputValue(), '');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mentation.takeaways.v1')).length), 0);
  // Route change unmounts the outer and inner layers together.
  await note.getByRole('link', { name: 'Read or delete saved notes', exact: true }).click();
  await page.waitForURL('**/return-points');
  await page.getByRole('searchbox', { name: 'Find saved work', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.journey-dialog-layer').length === 0);
  assert.equal(await page.locator('#root').getAttribute('inert'), null, 'Navigation must restore root interactivity');
  assert.notEqual(await page.locator('#root').getAttribute('aria-hidden'), 'true', 'Navigation must restore accessibility');
  assert.notEqual(await page.locator('body').evaluate(element => element.style.overflow), 'hidden', 'Navigation must release scroll lock');
  await page.getByRole('searchbox', { name: 'Find saved work', exact: true }).fill('Interactive after nested navigation');
  await focused('#saved-work-search');
}
