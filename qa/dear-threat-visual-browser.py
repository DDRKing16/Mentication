"""Compare the actual host journey: automatic visual, required gate, mobile history."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('BASE_URL','http://127.0.0.1:5196')
BEFORE=os.environ.get('BEFORE_URL','http://127.0.0.1:5197')
OUT=Path(os.environ.get('EVIDENCE_DIR','/tmp/dear-threat-evidence'));OUT.mkdir(parents=True,exist_ok=True)
KEY='dear2100-book-v1'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium');report=[];errors=[]
 for baseline in [True,False]:
  for width in [320,390]:
   for barrier in (['fear'] if baseline else ['fear','practical','both']):
    ctx=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');ctx.add_init_script("localStorage.setItem('haven_onboarded','1')");page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto((BEFORE if baseline else BASE)+'/dear-2100');f=page.frame_locator('iframe[title="Dear 2100"]')
    def click(name):f.get_by_role('button',name=name,exact=True).click()
    click('Begin');click('I have my own idea');f.get_by_role('textbox').fill('Learn music');click('Explore this')
    if barrier!='fear':f.get_by_role('radio',name='Practical limits' if barrier=='practical' else 'Both',exact=True).check()
    click('Continue')
    if barrier!='practical':f.get_by_role('textbox').fill('I might make a mistake');click('Continue' if barrier=='both' else 'Next: Understand the alarm')
    if barrier!='fear':f.get_by_role('textbox').fill('I need an instrument');click('Next: Understand the alarm')
    if baseline:
     expect(f.locator('.threat-system')).to_be_visible();expect(f.locator('.evolution-model')).to_have_count(0)
     page.screenshot(path=str(OUT/f'before-host-{width}.png'),full_page=True)
     f.locator('.threat-system-principle').click();expect(f.get_by_role('dialog').locator('.evolution-model')).to_be_visible()
     page.screenshot(path=str(OUT/f'before-optional-dialog-{width}.png'),full_page=True)
    else:
     visual=f.locator('.threat-required-visual');expect(visual).to_be_visible();expect(visual.locator('.evolution-copy em')).to_have_count(8);expect(f.get_by_role('dialog')).to_have_count(0);expect(f.locator('.threat-understanding-check')).to_have_count(0)
     page.wait_for_function("history.state?.['menticationScreen:dear2100']?.id==='threat-visual'")
     assert f.locator('body').evaluate('(e)=>e.scrollWidth<=innerWidth')
     page.screenshot(path=str(OUT/f'after-host-{barrier}-{width}.png'),full_page=True)
     # Save/exit and fresh host restore must preserve the required screen.
     page.get_by_role('button',name='Save & return Home',exact=True).click();page.wait_for_url(BASE+'/');page.goto(BASE+'/dear-2100');expect(visual).to_be_visible()
     click('Continue to the four threat phases');expect(f.locator('.threat-system')).to_be_visible();page.wait_for_function("history.state?.['menticationScreen:dear2100']?.id==='stage-3'")
     page.evaluate('history.back()');expect(visual).to_be_visible();page.evaluate('history.forward()');expect(f.locator('.threat-system')).to_be_visible()
     page.reload();expect(f.locator('.threat-system')).to_be_visible();click('Check my understanding');expect(f.get_by_role('button',name='Next question',exact=True)).to_be_disabled()
     page.evaluate('history.back()');expect(f.locator('.threat-system')).to_be_visible();page.evaluate('history.forward()');expect(f.locator('.threat-understanding-check')).to_be_visible()
     for index,answer in enumerate([2,0,3,1]):
      f.get_by_role('radio').nth(answer).check();click('Next question' if index<3 else 'Check my answers')
     click('Continue');expect(f.locator('.flow-experience-4')).to_be_visible()
     page.wait_for_function('JSON.parse(localStorage.getItem("dear2100-book-v1")).book.step===4')
     saved=page.evaluate('JSON.parse(localStorage.getItem("dear2100-book-v1"))');saved['book'].pop('threatVisualSeen');saved['book']['step']=8;saved['book']['furthestStep']=9;saved['book']['resume']['view']='plan'
     page.evaluate('data=>localStorage.setItem("dear2100-book-v1",JSON.stringify(data))',saved);page.reload();expect(visual).to_be_visible()
     # A legacy quiz pass alone cannot skip the new automatic teaching screen.
     click('Open journey overview');f.locator('.journey-overview button').last.click();expect(visual).to_be_visible()
     click('Continue to the four threat phases');click('Check my understanding')
     for index in range(4):click('Next question' if index<3 else 'Check my answers')
     expect(f.get_by_role('status')).to_contain_text('4 of 4 correct (100%)')
    report.append({'baseline':baseline,'width':width,'barrier':barrier,'automaticVisual':not baseline,'allEightExplanationsVisible':not baseline});print('PASS',report[-1],flush=True);ctx.close()
 assert not errors,errors
 (OUT/'visual-comparison.json').write_text(json.dumps(report,indent=2));b.close()
