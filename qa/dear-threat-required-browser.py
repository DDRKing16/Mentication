"""Required Dear 2100 screen/check: real static journey, saved state and alternate navigation."""
import os, json, copy
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
URL=os.environ.get('DEAR_URL','http://127.0.0.1:5190/dear2100-updated/index.html')
KEY='dear2100-book-v1'
correct=[2,0,3,1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium');errors=[]
 def open_page(book=None,width=390):
  c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');
  c.add_init_script("document.modelContext={registerTool: tool=>{(window.dearTools ||= {})[tool.name]=tool;return Promise.resolve();}}")
  if book is not None:
   seed=json.dumps(json.dumps({'version':1,'book':book}))
   c.add_init_script('localStorage.setItem("dear2100-book-v1",'+seed+')')
  page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL);return c,page
 def click(page,name):page.get_by_role('button',name=name,exact=True).click()
 def threat(page):expect(page.get_by_role('region',name='Our Threat Detection System',exact=True)).to_be_visible()
 def check(page,answers):
  for index,value in enumerate(answers):page.locator('.threat-understanding-check fieldset').nth(index).get_by_role('radio').nth(value).check()
 def stored(page):
  page.wait_for_function('localStorage.getItem("dear2100-book-v1")!==null');return page.evaluate('JSON.parse(localStorage.getItem("dear2100-book-v1")).book')
 for focus in ['fear','practical','both']:
  c,page=open_page(width=320 if focus=='practical' else 390)
  click(page,'Begin');click(page,'I have my own idea');page.get_by_role('textbox').fill('Learn music');click(page,'Explore this')
  if focus!='fear':click(page,'Practical limits' if focus=='practical' else 'Both')
  for field in page.get_by_role('textbox').all():field.fill('Synthetic barrier')
  click(page,'Next: Understand the alarm');threat(page)
  if focus=='practical':
   evidence=Path(os.environ.get('DEAR_EVIDENCE_DIR','/tmp/dear-threat-required'));evidence.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(evidence/'threat-and-check-320.png'),full_page=True)
  advance=page.locator('.flow-actions .primary-button');expect(advance).to_be_disabled()
  for _ in range(3):click(page,'Next threat phase')
  expect(advance).to_be_disabled() # displaying every scene does not pass the check
  click(page,'Dear 2100 home');page.get_by_role('button',name='Resume saved step: Threat detection',exact=True).click();threat(page);expect(advance).to_be_disabled()
  click(page,'Previous stage');click(page,'Next: Understand the alarm');threat(page);expect(advance).to_be_disabled()
  first=page.locator('.threat-understanding-check fieldset').first.get_by_role('radio').nth(2);first.focus();first.press('Space');expect(first).to_be_checked()
  check(page,[2,0,3]);expect(page.get_by_role('button',name='Check my answers')).to_be_disabled()
  check(page,[0,1,3,1]);click(page,'Check my answers');expect(page.get_by_role('status')).to_contain_text('2 of 4 correct (50%)');expect(advance).to_be_disabled()
  assert page.locator('.threat-check-feedback').count()==4
  page.reload();threat(page);expect(advance).to_be_disabled();expect(page.get_by_role('status')).to_contain_text('50%')
  click(page,'Try the four questions again');expect(page.locator('.threat-understanding-check input').first).to_be_focused();expect(page.get_by_role('button',name='Check my answers')).to_be_disabled()
  check(page,[0,0,3,1]);click(page,'Check my answers');expect(page.get_by_role('status')).to_contain_text('3 of 4 correct (75%)');expect(advance).to_be_enabled()
  # Going back and changing the barrier does not erase valid work or the explicit pass.
  click(page,'Previous stage');click(page,'Next: Understand the alarm');threat(page);expect(advance).to_be_enabled()
  advance.click();expect(page.locator('.flow-experience-4')).to_be_visible()
  page.reload();expect(page.locator('.flow-experience-4')).to_be_visible()
  page.wait_for_function('JSON.parse(localStorage.getItem("dear2100-book-v1")).book.threatCheck?.submitted===true');base=stored(page);assert base['threatCheck']['submitted'] and base['answers']['want']=='Learn music'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if focus=='practical':
   click(page,'Previous stage');page.evaluate('document.documentElement.style.fontSize="150%"');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');threat(page)
  print('PASS fresh',focus,'unanswered, fail, retry, 75%, home exit/resume, keyboard, back, refresh, preserved answers')
  if focus=='fear':
   click(page,'Dear 2100 home');page.get_by_role('textbox').fill('A new direction');click(page,'Explore this');click(page,'Start a new direction')
   page.get_by_role('textbox').fill('Another synthetic barrier');click(page,'Next: Understand the alarm');threat(page);expect(advance).to_be_disabled();expect(page.get_by_role('button',name='Check my answers')).to_be_disabled()
   print('PASS new chapter resets the old pass')
  c.close()
 # Old returning books have no inferred pass, even with downstream/furthest progress.
 for view in ['journey','plan','home','book']:
  old=copy.deepcopy(base);old.pop('threatCheck',None);old['step']=8;old['furthestStep']=9;old['resume']['view']=view
  c,page=open_page(old,width=1100)
  if view in ['journey','plan']:threat(page)
  elif view=='home':
   page.get_by_role('button',name='My next step',exact=True).click();threat(page)
  else:
   # Historical saved-book access remains available; opening a current plan is gated.
   click(page,'My next step');threat(page)
  expect(page.locator('.flow-actions .primary-button')).to_be_disabled()
  # Overview, stage rail and the registered alternate view entry cannot jump over the check.
  click(page,'Open journey overview');page.locator('.journey-overview button').last.click();threat(page)
  page.locator('.chapter-rail nav button').nth(7).click();threat(page)
  page.evaluate('window.dearTools.open_journey_view.execute({view:"plan"})');threat(page)
  expect(page.locator('.flow-actions .primary-button')).to_be_disabled()
  check(page,correct);click(page,'Check my answers');expect(page.get_by_role('status')).to_contain_text('4 of 4 correct (100%)')
  page.locator('.chapter-rail nav button').nth(7).click();expect(page.locator('.flow-experience-8')).to_be_visible()
  assert stored(page)['answers']['practicalNote']==base['answers']['practicalNote']
  print('PASS legacy/alternate',view,'overview, stage rail, model tool, 100%, preserved progress')
  c.close()
 assert not errors,errors
 b.close()
