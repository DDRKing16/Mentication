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
        await p.waitForTimeout(220);
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
    for(let i=0;i<5;i++){
      if(await p.locator('.happy-bump').count())break;
      if(await p.getByRole('button',{name:'4',exact:true}).isVisible())await click('4');
      if(await p.getByRole('combobox',{name:'Current distress'}).count())await p.getByRole('combobox',{name:'Current distress'}).selectOption('3');
      await p.waitForTimeout(200);
      const next=p.getByRole('button',{name:/^(Continue|Start .+|Build my reset)$/}).filter({visible:true});
      if(!await next.count() || !await next.first().isEnabled())break;
      try{await next.first().click();}catch(error){console.log(await p.locator('body').innerText());throw error;}await p.waitForTimeout(300);
    }
    await p.locator('.happy-bump').or(p.getByRole('button',{name:'Begin',exact:true})).first().waitFor();
    if(await p.getByRole('button',{name:'Begin',exact:true}).isVisible())await click('Begin');
    await click('Start');
    await click('Skip ahead');
    await click("I've had some water");
    await click('Skip ahead');
    await click('1 min');
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
    await click('Something I am proud of');
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
    await click('Optional: choose something afterward');
    await click('A guilt-free break');
    await shot('plan');
    await p.goBack();
    assert.equal(await p.getByRole('textbox',{name:'Pair it with'}).inputValue(),'Favourite playlist');
    await p.goForward();
    assert.equal(await p.getByRole('textbox',{name:'Reward after'}).inputValue(),'A guilt-free break');
    await p.reload();
    await p.getByRole('heading',{name:'What is your next small action?',exact:true}).waitFor();
    assert.equal(await p.getByRole('textbox',{name:'The activity'}).inputValue(),'');
    await p.getByRole('textbox',{name:'The activity'}).fill('Read two pages');
    await click('Optional: make it easier');
    await click('Favourite playlist');
    await click('Optional: choose something afterward');
    await click('A guilt-free break');
    await p.evaluate(() => document.documentElement.style.fontSize = '24px');
    await shot('large-text');
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await p.evaluate(() => document.documentElement.style.fontSize = '16px');
    await click("Keep my next move");
    await click('Skip ahead');
    await click('Skip and continue');
    await shot('completion');
    await p.getByText('Keep these practice choices', {
      exact: true
    }).click();
    await click('Save on this device');
    if(await p.getByRole('button',{name:'Back to practice',exact:true}).isVisible())await click('Back to practice');
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
    for(let i=0;i<5;i++){
      if(await p.locator('.happy-bump').count())break;
      if(await p.getByRole('button',{name:'4',exact:true}).isVisible())await click('4');
      if(await p.getByRole('combobox',{name:'Current distress'}).count())await p.getByRole('combobox',{name:'Current distress'}).selectOption('3');
      await p.waitForTimeout(200);
      const next=p.getByRole('button',{name:/^(Continue|Start .+|Build my reset)$/}).filter({visible:true});
      if(!await next.count() || !await next.first().isEnabled())break;
      try{await next.first().click();}catch(error){console.log(await p.locator('body').innerText());throw error;}await p.waitForTimeout(300);
    }
    await p.locator('.happy-bump').or(p.getByRole('button',{name:'Begin',exact:true})).first().waitFor();
    if(await p.getByRole('button',{name:'Begin',exact:true}).isVisible())await click('Begin');
    await p.getByRole('button',{name:'Run my saved bump',exact:true}).click();
    await p.getByText('Not answered · confirm the displayed rating or skip',{exact:true}).waitFor();
    await shot('repeat-unanswered');
    assert.deepEqual(errors, []);
    console.log(width, height, 'Happy full click-only path; paused short walk; reload preserves stage and clears unsaved words; re-enter plan; 150% text; optional save/delete; saved preferences repeat with unanswered energy; no errors');
    await p.close();
  }
  await b.close();
})();
