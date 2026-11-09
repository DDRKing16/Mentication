import assert from 'node:assert/strict';

const button = (page, name) => page.getByRole('button', { name, exact: true });
async function openFromLibrary(page, origin, name) {
  await page.goto(`${origin}/library`);
  await page.getByRole('textbox', { name: 'Search practices and restoring activities', exact: true }).fill(name);
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
}
// Next and Urge are matched-assessment practices. Enter via the same explicit
// baseline controls as a user, rather than seeding answers or bypassing setup.
async function startMatchedPractice(page, name, question) {
  await page.getByRole('heading', { name: question, exact: true }).waitFor();
  const start = button(page, `Start ${name}`);
  assert(await start.isDisabled(), 'An unanswered baseline must not start a practice');
  await button(page, '5').click();
  assert.equal(await button(page, '5').getAttribute('aria-pressed'), 'true');
  await start.click();
}
async function background(page) {
  return page.evaluate(() => ({
    overflow: document.body.style.overflow,
    root: ['aria-hidden', 'inert', 'style'].map(name => document.getElementById('root')?.getAttribute(name) ?? null),
  }));
}
async function closed(page, snapshot, opener) {
  await page.locator('.mcn-practice-layer').waitFor({ state: 'detached' });
  assert.deepEqual(await background(page), snapshot, 'Closing must restore the root and body scroll state');
  if (opener) assert(await opener.evaluate(node => document.activeElement === node), 'Closing must restore keyboard focus to the opener');
}
async function opened(page, id) {
  const dialog = page.locator(`dialog[aria-labelledby="${id}"]`);
  await dialog.waitFor({ state: 'visible' });
  assert(await dialog.evaluate(node => node.contains(document.activeElement)), 'Initial focus belongs inside the dialog');
  const controls = dialog.getByRole('button');
  await controls.last().focus(); await page.keyboard.press('Tab');
  assert(await dialog.evaluate(node => node.contains(document.activeElement)), 'Tab must remain in dialog');
  await controls.first().focus(); await page.keyboard.press('Shift+Tab');
  assert(await dialog.evaluate(node => node.contains(document.activeElement)), 'Shift-Tab must remain in dialog');
  assert.equal(await dialog.getAttribute('aria-modal'), 'true');
  return dialog;
}
async function activate(control) { await control.focus(); await control.click(); }

// The caller owns browser startup, onboarding and native/forced-legacy mode.
async function checkNextStepDialog(page, origin) {
  await page.goto(`${origin}/next-easiest-step`);
  await startMatchedPractice(page, 'Next Easiest Step', 'How hard is it to focus right now?');
  await button(page, 'Tidy my desk').click();
  const pause = button(page, 'Pause'); await pause.waitFor();
  const nextBackground = await background(page);
  const action = await page.locator('#nes-current-action').textContent();
  await activate(pause); await opened(page, 'nes-pause-title');
  await page.keyboard.press('Escape'); await closed(page, nextBackground, pause);
  assert.equal(await page.locator('#nes-current-action').textContent(), action);
  await activate(pause); await opened(page, 'nes-pause-title');
  await button(page, 'Resume Focus').click(); await closed(page, nextBackground, pause);
  assert.equal(await page.locator('#nes-current-action').textContent(), action);
  await activate(pause); await opened(page, 'nes-pause-title');
  await button(page, 'Back to tasks').click(); await closed(page, nextBackground);
  await page.getByRole('heading', { name: 'Your task is here.', exact: true }).waitFor();

}

async function checkTomorrowParkingDialog(page, origin) {
  await openFromLibrary(page, origin, 'Tomorrow Parking Lot');
  // Tomorrow has no mandatory matched baseline; its safety gate is suitability.
  await page.getByRole('heading', { name: 'Can this wait until tomorrow?', exact: true }).waitFor();
  await button(page, 'It can wait').click();
  const note = page.locator('#tpl-note'), draft = 'Browser regression draft';
  await note.fill(draft);
  const exit = button(page, 'Exit'), parkingBackground = await background(page);
  await activate(exit); await opened(page, 'tpl-leave-title');
  await page.keyboard.press('Escape'); await closed(page, parkingBackground, exit);
  assert.equal(await note.inputValue(), draft);
  await activate(exit); await opened(page, 'tpl-leave-title');
  await button(page, 'Keep writing').click(); await closed(page, parkingBackground, exit);
  assert.equal(await note.inputValue(), draft);
  await activate(exit); await opened(page, 'tpl-leave-title');
  await button(page, 'Leave without saving changes').click(); await closed(page, parkingBackground);
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('mentication.tomorrowParking.draft.v1')).text), draft);
  await openFromLibrary(page, origin, 'Tomorrow Parking Lot');
  await note.waitFor(); assert.equal(await note.inputValue(), draft);
  const discardBackground = await background(page);
  await activate(button(page, 'Exit')); await opened(page, 'tpl-leave-title');
  await button(page, 'Discard draft and leave').click(); await closed(page, discardBackground);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('mentication.tomorrowParking.draft.v1')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('mentication.tomorrowParking.records.v1')), null, 'Leaving a draft must not park or save it');

}

async function checkUrgeSurfDialog(page, origin) {
  await openFromLibrary(page, origin, 'Urge Surfing');
  await startMatchedPractice(page, 'Urge Surfing', 'How distressed are you right now?');
  await page.getByRole('button', { name: /^Start a \d+-second pause$/ }).click();
  const end = button(page, 'End early'); await end.waitFor();
  const urgeBackground = await background(page);
  await activate(end); await opened(page, 'urge-end-title');
  await page.keyboard.press('Escape'); await closed(page, urgeBackground, end);
  await button(page, 'Resume practice').waitFor();
  await activate(end); await opened(page, 'urge-end-title');
  await button(page, 'Keep surfing').click(); await closed(page, urgeBackground, end);
  await button(page, 'Pause practice').waitFor();
  await activate(end); await opened(page, 'urge-end-title');
  await button(page, 'End gently').click(); await closed(page, urgeBackground);
  await page.getByText('Practice ended early', { exact: true }).waitFor();
}

// A failure in one practice must not hide coverage of the other two. Each
// scenario begins with ordinary navigation, which also unmounts any failed
// scenario's open dialog without modifying storage or bypassing application UI.
export async function checkPracticeDialogs(page, origin) {
  const failures = [];
  for (const [name, check] of [
    ['Next Easiest Step', checkNextStepDialog],
    ['Tomorrow Parking Lot', checkTomorrowParkingDialog],
    ['Urge Surfing', checkUrgeSurfDialog],
  ]) {
    try {
      await check(page, origin);
      console.log(`PASS practice dialog: ${name}`);
    } catch (error) {
      let body;
      try { body = await page.locator('body').innerText({ timeout: 5000 }); }
      catch (captureError) { body = `Body capture unavailable: ${captureError.message}`; }
      const failure = `${name}: ${error.stack || error.message || String(error)}\nURL: ${page.url()}\nCurrent page body:\n${body}`;
      failures.push(failure);
      console.error(`FAIL practice dialog: ${failure}`);
    }
  }
  assert.equal(failures.length, 0, `Practice dialog failures (${failures.length}/3):\n\n${failures.join('\n\n')}`);
}
