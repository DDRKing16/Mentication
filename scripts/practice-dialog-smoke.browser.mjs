import assert from 'node:assert/strict';

const button = (page, name) => page.getByRole('button', { name, exact: true });
async function openFromLibrary(page, origin, name) {
  await page.goto(`${origin}/library`);
  await page.getByRole('textbox', { name: 'Search practices and restoring activities', exact: true }).fill(name);
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
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
export async function checkPracticeDialogs(page, origin) {
  await page.goto(`${origin}/next-easiest-step`);
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

  await openFromLibrary(page, origin, 'Tomorrow Parking Lot');
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

  await openFromLibrary(page, origin, 'Urge Surfing');
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
