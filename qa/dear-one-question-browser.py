from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json,os
OUT=Path(os.environ.get('DEAR_EVIDENCE_DIR','/tmp/dear-one-question'));OUT.mkdir(parents=True,exist_ok=True);BASE=os.environ.get('BASE_URL','http://127.0.0.1:5194');errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium')
 for width in [320,390]:
  ctx=b.new_context(viewport={'width':width,'height':640},reduced_motion='reduce');pg=ctx.new_page();pg.set_default_timeout(7000);pg.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',e,flush=True)))
  pg.goto(BASE+'/dear2100-updated/index.html')
  def click(name):
   role='radio' if name in ['Both','Tomorrow','Evening','5 min'] else 'button'
   pg.get_by_role(role,name=name,exact=True).click()
  def h(text):expect(pg.locator('.sequential-question h1')).to_have_text(text)
  def one():assert pg.locator('.sequential-question').count()==1;assert pg.get_by_role('textbox').count()<=1;assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  click('Begin');click('I have my own idea');pg.get_by_role('textbox').fill('Learn music');click('Explore this');h('What’s getting in the way?');click('Both');click('Continue');h('If you try, what are you afraid might happen?');pg.get_by_role('textbox').fill('I might make a mistake');one();pg.screenshot(path=str(OUT/f'dear-fear-{width}.png'),full_page=True);click('Continue');h('What practical thing is in the way?');pg.get_by_role('textbox').fill('I need access to an instrument');pg.wait_for_timeout(500);pg.reload();h('What practical thing is in the way?');expect(pg.get_by_role('textbox')).to_have_value('I need access to an instrument');click('Previous stage');h('If you try, what are you afraid might happen?');expect(pg.get_by_role('textbox')).to_have_value('I might make a mistake');click('Continue');click('Next: Understand the alarm');expect(pg.get_by_role('region',name='Our Threat Detection System',exact=True)).to_be_visible();assert pg.locator('.threat-understanding-check').count()==0
  click('Check my understanding')
  for i,value in enumerate([0,1,3,1]):
   assert pg.locator('.threat-understanding-check fieldset').count()==1;pg.get_by_role('radio').nth(value).check();click('Next question' if i<3 else 'Check my answers')
  expect(pg.get_by_role('status')).to_contain_text('2 of 4 correct (50%)');pg.reload();expect(pg.get_by_role('status')).to_contain_text('50%');click('Try the four questions again')
  for i,value in enumerate([0,0,3,1]):
   if i==1:click('Previous stage');assert pg.get_by_role('radio').nth(0).is_checked();click('Next question')
   pg.get_by_role('radio').nth(value).check();click('Next question' if i<3 else 'Check my answers')
  expect(pg.get_by_role('status')).to_contain_text('3 of 4 correct (75%)');pg.screenshot(path=str(OUT/f'dear-score-{width}.png'),full_page=True);click('Continue');h('When fear shows up, what do you usually do?');pg.get_by_role('textbox').fill('I postpone it');click('Continue');h('How far ahead would you like to look?');click('Explore the two roads');click('Put my futures into words');assert pg.get_by_role('textbox').count()==1;pg.get_by_role('textbox').fill('I could play one song');pg.locator('.flow-actions .primary-button').click();h('Which qualities do you want to carry forward?')
  for name in ['Courage','Learning','Play']:pg.locator('.flow-value-grid').get_by_role('button',name=name,exact=True).click()
  click('Continue');click('Move on to my plan');h('What’s your next small step?');pg.get_by_role('textbox').fill('Practise one passage');click('Continue');h('When would you like to try it?');click('Tomorrow');click('Continue');h('What part of the day suits you?');click('Evening');click('Continue');h('How long could you give it?');click('5 min');click('Continue');h('When fear returns, what will you do?');pg.get_by_role('textbox').fill('Notice it then try one note');pg.go_back();h('How long could you give it?');click('Continue');expect(pg.get_by_role('textbox')).to_have_value('Notice it then try one note');pg.wait_for_timeout(500);pg.reload();h('When fear returns, what will you do?');one();pg.screenshot(path=str(OUT/f'dear-backup-{width}.png'),full_page=True);click('Continue');click('Done for now');pg.wait_for_timeout(700);pg.screenshot(path=str(OUT/f'dear-closed-{width}.png'),full_page=True);click('I’ve tried it · add what happened');h('What did you observe?');one();pg.get_by_role('textbox').fill('I tried one note');pg.get_by_text('Add an optional detail',exact=True).click();click('How much discomfort did you experience?');h('How much discomfort did you experience?');pg.get_by_role('combobox').select_option('0');click('Return to my answer');h('What did you observe?');click('Save this observation');pg.wait_for_timeout(700);book=pg.evaluate('JSON.parse(localStorage.getItem("dear2100-book-v1")).book');assert book['entries'][0]['observed']=='I tried one note';assert book['entries'][0]['actualDiscomfort']==0; (OUT/f'dear-book-{width}.json').write_text(json.dumps(book))
  print('PASS Dear',width,'one field, back, fail/retry, 75%, refresh, saved/resume, zero rating, real observation');ctx.close()
 assert not errors,errors
 b.close()
