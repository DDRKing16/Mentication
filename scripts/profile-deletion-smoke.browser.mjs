import assert from 'node:assert/strict';

const HISTORY = 'mentation.sessions.v1';
const UNCERTAIN = 'mentation.reminders.uncertain.v1';
const PENDING = 'mentation.reminders.delete-pending.v1';
const OWNERSHIP = 'mentation.web-checkins.v1';
const META = ['mentication.firstwin.v1', 'mentication.heroWordmarkSeen.v1', 'mentication.whatsNewSeen.v1', 'mentication.lastStreak.v1', 'mentication.bestStreak.v1', 'mentication.startGlowSeen.v1', 'mentication.fullWeekCelebrated.v1', 'mentication.home.accessibility.v1', 'mentication.plus.notify.v1', 'mentication.plus.v1'];
const button = (page, name) => page.getByRole('button', {name, exact:true});
const erased = page => page.getByRole('status').filter({hasText:'App data deleted from this device.'});
const warning = page => page.getByRole('status').filter({hasText:'Daily reminder cleanup could not be confirmed'});
async function setup(page, base, uncertain = true) {
  await page.goto(`${base}/profile`);
  await page.evaluate(({HISTORY, UNCERTAIN, PENDING, OWNERSHIP, META, uncertain}) => {
    // Only this isolated test context is cleared. Never used against live data.
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('haven_onboarded', '1');
    localStorage.setItem(HISTORY, JSON.stringify([{id:'synthetic-profile', direction:'calm', created_date:'2026-11-19T00:00:00Z'}]));
    localStorage.setItem('daybook', 'synthetic private note');
    localStorage.setItem('mentation.restore-copies.v1', 'synthetic previous versions');
    localStorage.setItem('mentication.unrelated', 'preserve local');
    localStorage.setItem(OWNERSHIP, JSON.stringify({pendingCancel:true, token:'synthetic-not-a-real-owner'}));
    for (const key of META) localStorage.setItem(key, 'synthetic metadata');
    if (uncertain) { localStorage.setItem(UNCERTAIN,'1'); localStorage.setItem(PENDING,'1'); }
    sessionStorage.setItem('vector-shift:v2:synthetic', 'synthetic reflection');
    sessionStorage.setItem('mentication.unrelated', 'preserve session');
  }, {HISTORY, UNCERTAIN, PENDING, OWNERSHIP, META, uncertain});
  await page.reload();
  await button(page, 'Delete all my data').waitFor();
}
async function confirm(page) {
  await button(page, 'Delete all my data').click();
  await page.getByText('This cannot be undone.', {exact:false}).waitFor();
  await button(page, 'Yes, delete everything').click();
}
export async function checkProfileDeletion(page, base) {
  await page.context().route('**/v1/plan**', route => route.fulfill({status:503, contentType:'application/json', body:'{}'}));
  console.log('Profile deletion: cancellation, latched uncertainty, metadata and retry');
  await setup(page, base);
  await button(page, 'Delete all my data').click(); await button(page, 'Cancel').click();
  assert.equal(await page.evaluate(() => localStorage.getItem('daybook')), 'synthetic private note');
  await confirm(page); await erased(page).waitFor(); await warning(page).waitFor();
  const remaining = await page.evaluate(({HISTORY, UNCERTAIN, PENDING, OWNERSHIP, META}) => ({
    erased:[HISTORY, 'daybook', 'mentation.restore-copies.v1', ...META].map(key=>localStorage.getItem(key)),
    uncertainty:localStorage.getItem(UNCERTAIN), pending:localStorage.getItem(PENDING), ownership:localStorage.getItem(OWNERSHIP),
    local:localStorage.getItem('mentication.unrelated'), temporary:sessionStorage.getItem('mentication.unrelated'),
    reflection:sessionStorage.getItem('vector-shift:v2:synthetic'),
  }), {HISTORY, UNCERTAIN, PENDING, OWNERSHIP, META});
  assert(remaining.erased.every(value=>value===null));
  assert.equal(remaining.uncertainty,'1'); assert.equal(remaining.pending,'1'); assert(remaining.ownership);
  assert.equal(remaining.local,'preserve local'); assert.equal(remaining.temporary,'preserve session'); assert.equal(remaining.reflection,null);
  assert.equal(await page.locator('html').evaluate(node=>node.scrollWidth>innerWidth+1),false,'Profile deletion overflows phone width');
  await page.evaluate(()=>localStorage.setItem('daybook','synthetic new note after erasure'));
  await button(page,'Retry reminder cleanup').click(); await warning(page).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('daybook')), 'synthetic new note after erasure');
  await page.goto(`${base}/settings`);
  await page.getByRole('status').filter({hasText:'phone'}).waitFor();
  await button(page,'Retry reminder cleanup').click();
  await page.getByRole('status').filter({hasText:'phone'}).waitFor();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),UNCERTAIN),'1');

  console.log('Profile deletion: silent partial removal failure and real retry');
  await setup(page,base,false);
  await page.evaluate(()=>{
    const remove=Storage.prototype.removeItem;
    window.__restoreProfileStorage=()=>{Storage.prototype.removeItem=remove;};
    Storage.prototype.removeItem=function(key){if(this===localStorage&&key==='daybook')return;return remove.call(this,key);};
  });
  await confirm(page);
  await page.getByRole('alert').filter({hasText:'Some app data could not be verified as deleted'}).waitFor();
  assert.equal(await erased(page).count(),0);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),HISTORY),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('daybook')),'synthetic private note');
  await page.evaluate(()=>window.__restoreProfileStorage());
  await button(page,'Yes, delete everything').click(); await erased(page).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('daybook')),null);
  assert.equal(await warning(page).count(),0);
  await button(page,'Back to start').click();
  await page.waitForURL(url=>url.pathname === '/' || url.pathname === '/welcome');
}
