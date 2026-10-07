"""Reload the app shell, then traverse native history; never store answers in history."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('BASE_URL','http://127.0.0.1:5194')
OUT=Path(os.environ.get('FD_EVIDENCE_DIR','/tmp/foundations-dear-host-history'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium');report=[]
 for flow in ['cue','review','dear']:
  ctx=b.new_context(viewport={'width':320,'height':640},reduced_motion='reduce');ctx.add_init_script("localStorage.setItem('haven_onboarded','1')");page=ctx.new_page();page.set_default_timeout(8000);page.goto(BASE+'/library')
  if flow!='dear':
   plan={'version':2,'id':'synthetic-host-plan','revision':1,'domain':'sleep','action':0,'size':'tiny','cue':'','time':'','savedAt':'2026-10-07','reviews':[]}
   draft={'version':2,'screen':'plan' if flow=='cue' else 'review','state':{'q':0,'responses':{'overall':3},'priority':'sleep','selected':0,'dose':{'id':'tiny'},'cue':'','time':'','review':{},'planId':plan['id'],'planRevision':1,'history':[]}}
   page.evaluate('data=>{localStorage.setItem("mentication.foundations.draft.v2",JSON.stringify(data.draft));localStorage.setItem("mentication.foundations.weekly-plan.v2",JSON.stringify(data.plan))}',{'draft':draft,'plan':plan});page.goto(BASE+'/foundations');frame=page.frame_locator('iframe[title="Foundations"]');expect(frame.locator('.screen.active')).to_have_attribute('data-screen',draft['screen'],timeout=15000)
   page.wait_for_function("expected=>history.state?.['menticationScreen:foundations']?.id===expected",arg=draft['screen'])
   if flow=='cue':frame.locator('[data-next="cue"]').click();frame.locator('#planCue').select_option('After a meal');frame.locator('.screen.active [data-next="time"]').click();frame.locator('#planTime').fill('20:45');current='time';previous='cue'
   else:frame.locator('[data-review="tried"] button').nth(2).click();frame.locator('#reviewContinue').click();current='review-effort';previous='review'
   page.wait_for_function("expected=>history.state?.['menticationScreen:foundations']?.id===expected",arg=current);page.reload();frame=page.frame_locator('iframe[title="Foundations"]');expect(frame.locator('.screen.active')).to_have_attribute('data-screen',current,timeout=15000)
   page.evaluate('history.back()');expect(frame.locator('.screen.active')).to_have_attribute('data-screen',previous);page.evaluate('history.forward()');expect(frame.locator('.screen.active')).to_have_attribute('data-screen',current)
   state=page.evaluate('JSON.parse(localStorage.getItem("mentication.foundations.draft.v2")).state')
   if flow=='cue':assert state['cue']=='After a meal' and state['time']=='20:45';expect(frame.locator('#planTime')).to_have_value('20:45')
   else:assert state['review']=={'tried':3}
   history=page.evaluate("history.state['menticationScreen:foundations']");assert set(history)=={'id','cursors','depth'} and set(history['cursors'])=={'q'}
  else:
   page.goto(BASE+'/dear-2100');frame=page.frame_locator('iframe[title="Dear 2100"]');frame.get_by_role('button',name='Begin',exact=True).click();frame.get_by_role('button',name='I have my own idea',exact=True).click();frame.get_by_role('textbox').fill('Synthetic direction');frame.get_by_role('button',name='Explore this',exact=True).click();frame.get_by_role('button',name='Continue',exact=True).click();frame.get_by_role('textbox').fill('Synthetic prediction');frame.get_by_role('button',name='Next: Understand the alarm',exact=True).click();frame.get_by_role('button',name='Continue to the four threat phases',exact=True).click();frame.get_by_role('button',name='Check my understanding',exact=True).click();page.wait_for_function("history.state?.['menticationScreen:dear2100']?.id==='threat:0'");first=frame.locator('h1').inner_text();frame.get_by_role('radio').nth(2).check();frame.get_by_role('button',name='Next question',exact=True).click();frame.get_by_role('radio').nth(0).check();page.wait_for_function("history.state?.['menticationScreen:dear2100']?.id==='threat:1'");second=frame.locator('h1').inner_text();page.wait_for_timeout(400);page.reload();frame=page.frame_locator('iframe[title="Dear 2100"]');expect(frame.locator('h1')).to_have_text(second);page.evaluate('history.back()');expect(frame.locator('h1')).to_have_text(first);page.evaluate('history.forward()');expect(frame.locator('h1')).to_have_text(second);expect(frame.get_by_role('radio').nth(0)).to_be_checked()
   book=page.evaluate('JSON.parse(localStorage.getItem("dear2100-book-v1")).book');assert book['threatCheck']=={'answers':[2,0,None,None],'submitted':False};assert book['answers']['prediction']=='Synthetic prediction';history=page.evaluate("history.state['menticationScreen:dear2100']");assert set(history)=={'id','cursors','depth'} and set(history['cursors'])=={'stage'}
  assert 'Synthetic' not in json.dumps(history) and 'After a meal' not in json.dumps(history) and '20:45' not in json.dumps(history)
  page.screenshot(path=str(OUT/f'{flow}-forward-after-app-reload-320.png'),full_page=True);report.append({'flow':flow,'wholeAppReload':True,'nativeBackPreviousQuestion':True,'nativeForwardReturnsQuestion':True,'savedInputsPreserved':True,'historyContainsOnlyPublicCursor':True});print('PASS',flow,'whole-app reload/native Back/Forward, exact saved inputs, public history only');ctx.close()
 (OUT/'host-reload-history.json').write_text(json.dumps(report,indent=2));b.close()
