"""Regression for independently reviewed Restore history/feedback findings."""
import json, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('BASE_URL','http://127.0.0.1:5196')
OUT=Path(os.environ.get('EVIDENCE_DIR','/tmp/restore-review-evidence'));OUT.mkdir(parents=True,exist_ok=True)
def choose(page,title): page.get_by_role('button',name=re.compile('^'+re.escape(title))).click()
def read(page,key): return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)||"null")',key)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);reports=[]
 for width in [320,390]:
  for next_title in ['Easy reading','Comfortable breathing']:
   context=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');context.add_init_script("try{localStorage.setItem('haven_onboarded','1')}catch{}");page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(BASE+'/restore');choose(page,'Comfortable breathing');page.get_by_role('button',name='Begin',exact=True).click()
   page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Finish this break',exact=True).click();page.get_by_role('button',name='Save without feedback',exact=True).click()
   reflection=page.url;original=read(page,'mentation.restore.history.v1')[0]
   page.get_by_role('button',name='Restoring options',exact=True).click();choose(page,next_title);page.get_by_role('button',name='Begin',exact=True).click();pending=read(page,'mentation.restore.draft.v1');assert pending['attemptId']!=original['attemptId']
   for _ in range(3):page.go_back()
   expect(page.get_by_role('heading',name='How was that pause?',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Save without feedback',exact=True)).to_be_disabled()
   assert read(page,'mentation.restore.history.v1')==[original]
   assert read(page,'mentation.restore.draft.v1')==pending
   for _ in range(3):page.go_forward()
   expect(page.get_by_role('button',name='Start timer',exact=True)).to_be_visible();assert read(page,'mentation.restore.draft.v1')==pending
   page.get_by_role('button',name='Stop here',exact=True).click();page.get_by_role('button',name='Save without feedback',exact=True).click()
   history=read(page,'mentation.restore.history.v1');assert len(history)==2 and history[0]['outcome']=='stopped' and history[1]==original
   page.goto(reflection);expect(page.get_by_role('button',name='Save without feedback',exact=True)).to_be_disabled();assert read(page,'mentation.restore.history.v1')==history
   page.goto(BASE+'/restore');choose(page,'Take a recovery day');page.get_by_role('button',name='Begin',exact=True).click();page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('textbox').fill('An optional errand can wait');page.get_by_role('button',name='Continue',exact=True).click();page.get_by_role('button',name='Finish planning',exact=True).click()
   expect(page.get_by_role('heading',name='How does this plan feel?',exact=True)).to_be_visible();expect(page.get_by_role('button',name='More rested',exact=True)).to_have_count(0)
   page.get_by_role('button',name='Manageable',exact=True).click();expect(page.get_by_role('status')).to_have_count(0);page.get_by_role('button',name='Save check-in',exact=True).click()
   plan=read(page,'mentation.restore.history.v1')[0];assert plan['outcome']=='planned' and plan['feedback']=='manageable' and plan['plan']=='An optional errand can wait'
   page.reload();expect(page.get_by_role('button',name='Save check-in',exact=True)).to_be_disabled();expect(page.get_by_role('status')).to_contain_text('a plan, not a completed activity')
   page.goto(BASE+'/restore');expect(page.get_by_text('An optional errand can wait',exact=True)).to_be_visible()
   choose(page,'Protect a sleep routine');page.get_by_role('button',name='Begin',exact=True).click();page.get_by_role('button',name='Stop here',exact=True).click();expect(page.get_by_role('button',name='More rested',exact=True)).to_have_count(0);expect(page.get_by_role('button',name='Manageable',exact=True)).to_be_visible();page.get_by_role('button',name='Save without feedback',exact=True).click();assert read(page,'mentation.restore.history.v1')[0]['outcome']=='stopped'
   page.screenshot(path=str(OUT/f'review-{width}-{next_title.split()[0].lower()}.png'))
   # Verify the existing app-wide deletion flow removes Restore plans/drafts.
   page.goto(BASE+'/profile');page.get_by_role('button',name='Delete all my data',exact=True).click();page.get_by_role('button',name='Yes, delete everything',exact=True).click()
   page.wait_for_function("!localStorage.getItem('mentation.restore.history.v1') && !localStorage.getItem('mentation.restore.draft.v1')")
   assert not errors,errors;reports.append({'width':width,'nextActivity':next_title,'historyBackForward':'passed','savedAttemptReadOnly':'passed','newDraftPreserved':'passed','planFeedbackAndRefresh':'passed','stoppedPlanning':'passed','profileDeletion':'passed','pageErrors':errors});print('PASS',width,next_title,flush=True);context.close()
 browser.close();(OUT/'report.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
