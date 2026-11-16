import assert from 'node:assert/strict';
import { dailyPractices, olderPalaceHistory, HISTORY_NOW } from './fixtures/lifetime-history.mjs';
const key='mentation.sessions.v1';
async function seed(page,records) {
  await page.evaluate(({key,records})=>{localStorage.setItem(key,JSON.stringify(records));window.dispatchEvent(new CustomEvent('mentation:sessions-changed'));},{key,records});
}
export async function checkLifetimeProgress(page,base) {
  await page.clock.setFixedTime(new Date(HISTORY_NOW));
  await page.goto(`${base}/palace`);
  const records=dailyPractices();await seed(page,records);
  await page.getByText('1200 stones',{exact:true}).waitFor();
  await page.getByText('Level 7 of 7',{exact:true}).waitFor();
  assert(await page.getByText(/×600$/).isVisible(),'All builder uses must remain counted');
  await page.reload();await page.getByText('1200 stones',{exact:true}).waitFor();
  await page.goto(base);
  await page.locator('[aria-label="200 day streak"]').waitFor();
  const home=page.frameLocator('iframe[title="MentiCation home"]');
  await home.locator('#palace-badge-level').getByText('Level 7 of 7',{exact:true}).waitFor();
  await page.goto(`${base}/insights`);
  await page.getByText(/latest 100 sessions • 200-day streak/).waitFor();
  await page.goto(`${base}/profile`);
  await page.getByText(/A place that grows with every practice · now at the palace in bloom/).waitFor();
  await page.getByText('Showing your latest 100 resets below. Older saved practices still count toward your palace and streak.',{exact:true}).waitFor();

  await page.goto(`${base}/palace`);await seed(page,olderPalaceHistory());
  await page.getByText('56 stones',{exact:true}).waitFor();
  await page.getByText('Level 7 of 7',{exact:true}).waitFor();
  // Cross the window again: an empty attempt must not erase earlier progress.
  await seed(page,[{id:'new-empty',created_date:HISTORY_NOW,attempts:[]},...olderPalaceHistory()]);
  await page.getByText('56 stones',{exact:true}).waitFor();
  const before=await page.evaluate(key=>localStorage.getItem(key),key);
  await page.evaluate(key=>{window.__savedGetItem=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===key)throw Error('Synthetic blocked history');return window.__savedGetItem.call(this,k);};window.dispatchEvent(new CustomEvent('mentation:sessions-changed'));},key);
  await page.getByRole('alert').getByText(/Your saved practice history could not be read/).waitFor();
  assert.equal(await page.getByText('Level 1 of 7',{exact:true}).count(),0,'Unreadable history must not be replaced with a zero palace');
  await page.evaluate(()=>{Storage.prototype.getItem=window.__savedGetItem;delete window.__savedGetItem;});
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before,'Read failure must not mutate history');
  await page.getByRole('button',{name:'Try reading practice history again',exact:true}).click();
  await page.getByText('56 stones',{exact:true}).waitFor();

  // Home recovers from corrupt history after a storage/focus lifecycle update.
  await page.evaluate(key=>localStorage.setItem(key,'{broken'),key);await page.goto(base);
  await home.locator('#palace-badge-level').getByText('History not checked',{exact:true}).waitFor();
  assert.equal(await page.locator('[aria-label$=" day streak"]').count(),0);
  await seed(page,records);await page.locator('[aria-label="200 day streak"]').waitFor();
  await home.locator('#palace-badge-level').getByText('Level 7 of 7',{exact:true}).waitFor();
  assert.equal(await page.locator('html').evaluate(node=>node.scrollWidth>innerWidth+1),false,'Long-history Home must fit phone width');
}
