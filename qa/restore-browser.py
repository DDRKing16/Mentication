"""Production preview QA for the ten original Restore activities."""
import json, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
OUT=Path(os.environ.get('EVIDENCE_DIR','/tmp/restore-evidence'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('BASE_URL','http://127.0.0.1:5196')
ACTIVITIES=['Comfortable breathing','Calming music','Non-sleep deep rest','Easy reading','Guided meditation','Relaxing nature viewing','Mindful tea break','Gentle outdoor walk','Take a recovery day','Protect a sleep routine']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);reports=[]
 for width in [320,390,768,1280]:
  context=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');context.add_init_script("try{localStorage.setItem('haven_onboarded','1')}catch{}")
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/restore')
  expect(page.get_by_role('heading',name='What would feel restful?')).to_be_visible(timeout=20000)
  expect(page.locator('[aria-label="Ten restoring activities"] > button')).to_have_count(10)
  page.screenshot(path=str(OUT/f'options-{width}.png'),full_page=True)
  selected=ACTIVITIES if width in [320,390] else ACTIVITIES[:1]
  for title in selected:
   page.get_by_role('button',name=re.compile('^'+re.escape(title))).click();expect(page.get_by_role('heading',name=title,exact=True)).to_be_visible();page.get_by_role('button',name='Begin',exact=True).click()
   if title==ACTIVITIES[0]:
    page.get_by_role('button',name='Start timer',exact=True).click();page.wait_for_timeout(1200);page.get_by_role('button',name='Pause timer',exact=True).click()
    timed=page.locator('[aria-label="Elapsed active practice time"]').inner_text();assert timed!='0:00';page.wait_for_timeout(1100);assert page.locator('[aria-label="Elapsed active practice time"]').inner_text()==timed
    page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Back',exact=True).click();expect(page.get_by_role('button',name='Continue',exact=True)).to_be_visible()
   page.get_by_role('button',name='Continue',exact=True).click()
   if title in ACTIVITIES[-2:]:page.get_by_role('textbox').fill('A small local plan for QA')
   page.get_by_role('button',name='Continue',exact=True).click()
   expect(page.get_by_role('button',name='Start timer',exact=True)).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'overflow {width} {title}'
   page.get_by_role('button',name='Finish planning' if title in ACTIVITIES[-2:] else 'Finish this break',exact=True).click()
   expect(page.get_by_role('heading',name='How does this plan feel?' if title in ACTIVITIES[-2:] else 'How was that pause?',exact=True)).to_be_visible()

   if title==ACTIVITIES[0]:
    page.get_by_role('button',name='More rested',exact=True).click()
    expect(page.get_by_role('status')).to_have_count(0)
    page.get_by_role('button',name='Save check-in',exact=True).click()
   else: page.get_by_role('button',name='Save without feedback',exact=True).click()
   expect(page.get_by_role('status')).to_contain_text('Saved on this device')
   page.goto(BASE+'/restore');expect(page.get_by_role('heading',name='What would feel restful?')).to_be_visible()
  # Refresh/exit resumes at the same stage with timer paused, then Stop here is
  # recorded as stopped rather than completed; returning does not auto-complete.
  page.get_by_role('button',name=re.compile('^Calming music')).click();page.get_by_role('button',name='Begin',exact=True).click();page.get_by_role('button',name='Continue',exact=True).click();page.reload()
  expect(page.get_by_role('button',name='Start timer',exact=True)).to_be_visible();page.get_by_role('link',name='Exit to Home',exact=True).click();page.goto(BASE+'/restore')
  page.get_by_role('button',name='Resume',exact=True).click();expect(page.get_by_role('heading',name='Listen without a task',exact=True)).to_be_visible()
  page.get_by_role('button',name='Stop here',exact=True).click();page.get_by_role('button',name='Save without feedback',exact=True).click();expect(page.get_by_role('status')).to_contain_text('stopped early')
  history=page.evaluate("JSON.parse(localStorage.getItem('mentation.restore.history.v1')||'[]')")
  assert history[0]['outcome']=='stopped';assert len(history)==len(selected)+1
  # Home route reaches Restore, and Guide me remains in the menu.
  page.goto(BASE+'/');home=page.frame_locator('iframe');expect(home.get_by_role('button',name='Restore',exact=True)).to_be_visible(timeout=20000)
  expect(page.get_by_role('status',name='Loading Mentication',exact=True)).to_be_hidden();expect(page.locator('iframe')).to_have_attribute('aria-hidden','false');home.get_by_role('button',name='Restore',exact=True).click();expect(page.get_by_role('heading',name='What would feel restful?')).to_be_visible(timeout=20000)
  page.goto(BASE+'/');home=page.frame_locator('iframe');expect(page.locator('iframe')).to_have_attribute('aria-hidden','false');home.get_by_role('button',name='Open menu',exact=True).click();expect(home.get_by_role('button',name='Guide me',exact=True)).to_be_visible()
  assert not errors,errors;reports.append({'width':width,'completedChoices':len(selected),'resume':'passed','timerPause':'passed','stop':'passed','homeNavigation':'passed','errors':errors});print('PASS',width,flush=True);context.close()
 (OUT/'report.json').write_text(json.dumps(reports,indent=2));browser.close();print(json.dumps(reports,indent=2))
