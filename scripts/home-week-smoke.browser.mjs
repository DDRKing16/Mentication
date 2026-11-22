import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { practice } from './fixtures/lifetime-history.mjs';

const frameName = 'iframe[title="MentiCation home"]';
const historyKey = 'mentation.sessions.v1';

export async function checkHomeWeek(page, base) {
  const now = new Date(2026, 10, 22, 9);
  await page.clock.setFixedTime(now);
  await page.goto(base);
  const home = page.frameLocator(frameName);
  const week = home.getByRole('region', { name: 'Your week', exact: true });
  const shortcuts = home.locator('.home-shortcuts');
  const today = shortcuts.locator('button[data-route="recommended"]');
  const oura = shortcuts.getByRole('button', { name: /Oura scores/i });
  const palace = shortcuts.getByRole('button', { name: /Peace Palace/i });
  const dialog = home.locator('#wellness-dialog');
  const badge = home.locator('#palace-badge-level');
  await week.waitFor();
  await oura.waitFor();
  await palace.waitFor();
  assert(!(await today.isVisible()), 'Fresh Home must not invent a recommendation');
  assert.equal(await week.getByRole('listitem').count(), 7, 'Your Week keeps the seven-day progression');
  assert(await week.getByRole('button', { name: 'Begin', exact: true }).isVisible());
  assert.equal(await week.locator('#wellness-open, #wellness-summary, #palace-badge-icon, #today-card').count(), 0, 'Only weekly content belongs in Your Week');
  await badge.getByText('Level 1 of 7', { exact: true }).waitFor();

  const records = Array.from({ length: 12 }, (_, i) => practice(`home-week-${i}`, new Date(now.getTime() - i * 86400000).toISOString()));
  await page.evaluate(({key, records}) => localStorage.setItem(key, JSON.stringify(records)), {key:historyKey, records});
  await page.reload();
  await today.getByText('Morning Lift', { exact: true }).waitFor();
  assert.match(await badge.textContent(), /Level [2-7] of 7/);

  const dir = 'output/home-week-qa';
  await mkdir(dir, { recursive: true });
  const browser = page.context().browser().browserType().name();
  const mode = await dialog.evaluate(node => typeof node.showModal === 'function' ? 'native' : 'fallback');
  async function assertLayout(width) {
    await shortcuts.scrollIntoViewIfNeeded();
    const boxes = [];
    for (const control of [today, oura, palace]) {
      const box = await control.boundingBox();
      assert(box && box.width >= 44 && box.height >= 44, `Shortcut touch target too small at ${width}px`);
      assert(box.x >= -1 && box.x + box.width <= width + 1, `Shortcut does not fit at ${width}px`);
      boxes.push(box);
      assert(await control.evaluate(node => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1), 'Shortcut content clips');
    }
    assert(boxes.every(box => Math.abs(box.y - boxes[0].y) <= 2), 'Three shortcuts must share the same row');
    for (let i = 1; i < boxes.length; i++) assert(boxes[i - 1].x + boxes[i - 1].width <= boxes[i].x + 1, 'Shortcut buttons overlap or are reordered');
    assert(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth + 1), 'Outer Home page overflows');
    assert(await home.locator('html').evaluate(node => node.scrollWidth <= innerWidth + 1), 'Home iframe overflows');
    assert(await home.locator('#today-title').evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const button = node.closest('button').getBoundingClientRect();
      const lines = [...range.getClientRects()];
      return lines.length > 0 && lines.every(line => line.left >= button.left - 1 && line.right <= button.right + 1 &&
        line.top >= button.top - 1 && line.bottom <= button.bottom + 1);
    }), 'The entire recommendation title must fit within its button');
  }
  for (const width of [320,390,1440]) {
    await page.setViewportSize({ width, height: 900 });
    await assertLayout(width);
    await week.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/${browser}-${mode}-${width}px.png`, animations: 'disabled' });
  }

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(`${base}/settings`);
  await page.getByRole('button', {name:'Extra large',exact:true}).click();
  await page.getByRole('switch', {name:/High contrast/}).click();
  for (const [hour, title] of [[9,'Morning Lift'],[12,'Midday Focus'],[15,'Afternoon Reset'],[20,'Evening Reset']]) {
    await page.clock.setFixedTime(new Date(2026, 10, 22, hour));
    await page.goto(base);
    await shortcuts.getByRole('button', {name:title,exact:true}).waitFor();
    await home.locator('html[data-text-scale="1.3"][data-high-contrast="true"]').waitFor({state:'attached'});
    await assertLayout(320);
    await week.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${dir}/${browser}-${mode}-320px-extra-large-contrast-${hour}.png`,
      animations: 'disabled',
    });
  }
  await page.clock.setFixedTime(now);
  await page.goto(base);
  await today.getByText('Morning Lift', {exact:true}).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(!(await home.locator('#wellness-summary').isVisible()), 'Scores should not show outside their dialog');
  await oura.focus();
  await page.keyboard.press('Enter');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByText(/Not available in this version/).waitFor();
  assert.equal(await home.locator('#wellness-open').getAttribute('aria-controls'), 'wellness-dialog');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await oura.evaluate(node => document.activeElement === node), 'Oura dialog must restore focus');

  // Test connected/consent presentation with synthetic data at the document
  // boundary, without connecting to a service or configuring a real account.
  await dialog.evaluate(node => {
    const frame = node.ownerDocument.defaultView;
    frame.MenticationHome.setWellness({ sources: [{
      id:'oura', name:'Oura', status:'connected', connected:true, detail:'Synthetic score fixture',
      snapshot:{ syncedAt:new Date().toISOString(), metrics:[{label:'Readiness',value:83,unit:'score',day:'2026-11-22'}] },
    }] });
  });
  await oura.click();
  await dialog.getByText('83 /100', { exact:true }).waitFor();
  assert(await dialog.getByRole('button', { name:'Sync now', exact:true }).isEnabled());
  assert(await dialog.getByRole('button', { name:'Disconnect & remove summaries', exact:true }).isEnabled());
  await dialog.evaluate(node => node.ownerDocument.defaultView.MenticationHome.setWellness({ sources: [{
    id:'oura', name:'Oura', status:'disconnected', connected:false, detail:'Synthetic consent fixture', consent:'Approve synthetic summaries',
  }] }));
  const connect = dialog.getByRole('button', {name:'Connect Oura',exact:true});
  assert(await connect.isDisabled(), 'Connecting must require explicit consent');
  await dialog.getByRole('checkbox', {name:'Approve synthetic summaries',exact:true}).check();
  assert(await connect.isEnabled(), 'Consent should enable connecting');
  await dialog.getByRole('checkbox', {name:'Approve synthetic summaries',exact:true}).uncheck();
  assert(await connect.isDisabled(), 'Revoking consent should disable connecting again');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state:'hidden' });

  await today.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname === '/reset');
  await page.goBack();
  await today.getByText('Morning Lift', { exact:true }).waitFor();
  await palace.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname === '/palace');
  await page.goBack();
  await today.waitFor();
  await page.evaluate(key => localStorage.setItem(key, '{broken'), historyKey);
  await page.reload();
  await badge.getByText('History not checked', { exact:true }).waitFor();
  assert(await palace.isVisible(), 'Peace Palace remains reachable if history is unavailable');
}
