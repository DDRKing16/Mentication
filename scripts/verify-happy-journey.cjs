// Synthetic local browser data. No external messaging or provider buttons are used.
const {
  chromium
} = require(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:5174';
const out = process.env.EVIDENCE_DIR || '/tmp/mentication-happy';
fs.mkdirSync(out, {
  recursive: true
});
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  for (const [width, height] of [[320, 640], [390, 844]]) {
    const p = await b.newPage({
      viewport: {
        width,
        height
      },
      reducedMotion: 'reduce'
    });
    p.setDefaultTimeout(7000);
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    const click = async name => {
      try {
        await p.getByRole('button', {
          name,
          exact: true
        }).click();
      } catch (e) {
        console.log(await p.locator('body').innerText());
        throw e;
      }
    };
    const shot = async name => {
      await p.waitForTimeout(500);
      await p.screenshot({
        path: `${out}/happy-after-${name}-${width}.png`,
        fullPage: true
      });
    };
    await p.goto(base + '/start');
    await p.evaluate(() => localStorage.setItem('haven_onboarded', '1'));
    await p.goto(base + '/library');
    await p.getByRole('textbox', {
      name: 'Search practices'
    }).fill('Happy Bump');
    await p.locator('button.library-world').filter({
      hasText: 'Happy Bump'
    }).click();
    await click('4');
    await p.getByRole('combobox', {
      name: 'Current distress'
    }).selectOption('3');
    await p.getByRole('button', {
      name: /^(Start .+|Build my reset)$/
    }).click();
    await click('Begin');
    await click('Start');
    await click('Skip ahead');
    await click("I've had some water");
    await click('Skip ahead');
    await click('Walk indoors');
    await p.getByRole('button', {
      name: 'Pause',
      exact: true
    }).click();
    await click('I took a shorter walk');
    await click('Skip ahead');
    await click('Put one thing away');
    await shot('mission-choice');
    await click('Make it my one mission');
    await shot('mission');
    await click('I made an honest start');
    await p.getByRole('textbox', {
      name: 'Your words',
      exact: true
    }).fill('I made room for one small step.');
    await click('Continue');
    await click('Learning & growth');
    await click('Choose a small step');
    await click('Read two pages');
    await click('Carry it forward');
    await p.getByRole('button', {
      name: /Productive/
    }).click();
    await p.getByText('Optional: make it easier', {
      exact: true
    }).click();
    await click('Favourite playlist');
    await click('A guilt-free break');
    await shot('plan');
    assert.equal(await p.locator('.happy-bump-contract dd').allTextContents().then(a => a.join('|')), 'Read two pages|Favourite playlist|A guilt-free break');
    await p.reload();
    await p.getByText('Optional: make it easier', {
      exact: true
    }).click();
    assert.equal(await p.getByRole('textbox', {
      name: 'Pair it with',
      exact: true
    }).inputValue(), '');
    await p.getByRole('textbox', {
      name: 'The activity',
      exact: true
    }).fill('Read two pages');
    await click('Favourite playlist');
    await click('A guilt-free break');
    await p.evaluate(() => document.documentElement.style.fontSize = '24px');
    await shot('large-text');
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await p.evaluate(() => document.documentElement.style.fontSize = '16px');
    await click("That's my next move");
    await click('Skip ahead');
    await shot('completion');
    await p.getByText('Keep these practice choices', {
      exact: true
    }).click();
    await click('Save on this device');
    await click('Save these preferences');
    await click('Done');
    await click('Finish here');
    await p.goto(base + '/return-points');
    await shot('saved-return');
    assert.equal(await p.locator('.return-record').count(), 1);
    await click('Delete this note');
    await p.reload();
    assert.equal(await p.locator('.return-record').count(), 0);
    await p.goto(base + '/library');
    await p.getByRole('textbox', {name:'Search practices'}).fill('Happy Bump');
    await p.locator('button.library-world').filter({hasText:'Happy Bump'}).click();
    await click('4');
    await p.getByRole('combobox',{name:'Current distress'}).selectOption('3');
    await p.getByRole('button',{name:/^(Start .+|Build my reset)$/}).click();
    await click('Begin');
    await p.getByRole('button',{name:'Run my saved bump',exact:true}).click();
    await p.getByText('Not answered · confirm the displayed rating or skip',{exact:true}).waitFor();
    await shot('repeat-unanswered');
    assert.deepEqual(errors, []);
    console.log(width, height, 'Happy full click-only path; paused short walk; reload preserves stage and clears unsaved words; re-enter plan; 150% text; optional save/delete; saved preferences repeat with unanswered energy; no errors');
    await p.close();
  }
  await b.close();
})();
