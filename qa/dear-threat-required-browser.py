"""Dear's four-question gate: sequential questions, truthful score and legacy guards."""
import os, json, copy
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
URL=os.environ.get('DEAR_URL','http://127.0.0.1:5194/dear2100-updated/index.html')
KEY='dear2100-book-v1'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium');errors=[]
 def open_page(book=None,width=390):
  ctx=b.new_context(viewport={'width':width,'height':640},reduced_motion='reduce')
  ctx.add_init_script("document.modelContext={registerTool:tool=>{(window.dearTools ||= {})[tool.name]=tool;return Promise.resolve();}}")
  if book is not None:ctx.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps({'version':1,'book':book}))+')')
  page=ctx.new_page();page.set_default_timeout(7000);page.on('pageerror',lambda error:errors.append(str(error)));page.goto(URL);return ctx,page
 def click(page,name):page.get_by_role('button',name=name,exact=True).click()
 def teaching(page):
  visual=page.locator('.threat-required-visual')
  if visual.count():
   expect(visual).to_be_visible();expect(visual.locator('.evolution-copy em')).to_have_count(8);click(page,'Continue to the four threat phases')
  expect(page.get_by_role('region',name='Our Threat Detection System',exact=True)).to_be_visible()
 def check(page,answers):
  for index,answer in enumerate(answers):
   assert page.locator('.threat-understanding-check fieldset').count()==1
   radio=page.get_by_role('radio').nth(answer);radio.focus();radio.press('Space')
   expect(radio).to_be_checked();click(page,'Next question' if index<3 else 'Check my answers')
 for focus in ['fear','practical','both']:
  ctx,page=open_page(width=320 if focus=='practical' else 390)
  click(page,'Begin');click(page,'I have my own idea');page.get_by_role('textbox').fill('Learn music');click(page,'Explore this')
  if focus!='fear':page.get_by_role('radio',name='Practical limits' if focus=='practical' else 'Both',exact=True).click()
  click(page,'Continue')
  if focus!='practical':page.get_by_role('textbox').fill('I might make a mistake');click(page,'Continue' if focus=='both' else 'Next: Understand the alarm')
  if focus!='fear':page.get_by_role('textbox').fill('I need access to an instrument');click(page,'Next: Understand the alarm')
  teaching(page);assert page.locator('.threat-understanding-check').count()==0
  for _ in range(3):click(page,'Next threat phase')
  click(page,'Check my understanding');expect(page.get_by_role('button',name='Next question',exact=True)).to_be_disabled()
  page.reload();expect(page.locator('.threat-understanding-check fieldset')).to_have_count(1)
  check(page,[0,1,3,1]);expect(page.get_by_role('status')).to_contain_text('2 of 4 correct (50%)');assert page.locator('.threat-check-feedback').count()==4
  page.reload();expect(page.get_by_role('status')).to_contain_text('50%');click(page,'Try the four questions again');check(page,[0,0,3,1]);expect(page.get_by_role('status')).to_contain_text('3 of 4 correct (75%)')
  click(page,'Continue');expect(page.locator('.flow-experience-4')).to_be_visible();page.reload();expect(page.locator('.flow-experience-4')).to_be_visible()
  page.wait_for_function('JSON.parse(localStorage.getItem("dear2100-book-v1")).book.threatCheck?.submitted===true');base=page.evaluate('JSON.parse(localStorage.getItem("dear2100-book-v1")).book');assert base['answers']['want']=='Learn music'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('PASS',focus,'one MCQ, keyboard, refresh, fail, retry, 75%, downstream preserved');ctx.close()
 for view in ['journey','plan','home','book']:
  old=copy.deepcopy(base);old.pop('threatCheck',None);old['step']=8;old['furthestStep']=9;old['resume']['view']=view;old['resume'].pop('question',None)
  ctx,page=open_page(old)
  if view in ['home','book']:click(page,'My next step')
  teaching(page)
  click(page,'Open journey overview');page.locator('.journey-overview button').last.click();teaching(page)
  page.evaluate('window.dearTools.open_journey_view.execute({view:"plan"})');teaching(page)
  click(page,'Check my understanding');check(page,[2,0,3,1]);expect(page.get_by_role('status')).to_contain_text('4 of 4 correct (100%)');click(page,'Continue');assert page.evaluate('JSON.parse(localStorage.getItem("dear2100-book-v1")).book.answers.want')=='Learn music'
  print('PASS legacy',view,'no inferred pass, overview/model guard, real 100%');ctx.close()
 assert not errors,errors;b.close()
