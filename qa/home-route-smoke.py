"""Existing Home paths remain reachable after the new Restore tile."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('BASE_URL','http://127.0.0.1:5196')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');c.add_init_script("try{localStorage.setItem('haven_onboarded','1')}catch{}");a=c.new_page();errors=[];a.on('pageerror',lambda e:errors.append(str(e)));report=[]
 for title in ['Calm','Lift','Focus','Ground','Sleep']:
  a.goto(BASE+'/');expect(a.locator('iframe')).to_have_attribute('aria-hidden','false',timeout=20000);a.frame_locator('iframe').get_by_role('button',name=title,exact=True).click();a.wait_for_url('**/reset');expect(a.get_by_role('heading').first).to_be_visible();report.append({'existingHomeChoice':title,'route':'/reset','passed':True})
 a.goto(BASE+'/');expect(a.locator('iframe')).to_have_attribute('aria-hidden','false');a.frame_locator('iframe').get_by_role('button',name='Open menu',exact=True).click();a.frame_locator('iframe').get_by_role('button',name='Guide me',exact=True).click();a.wait_for_url('**/start');expect(a.get_by_role('heading',name='What would help you begin?',exact=True)).to_be_visible();report.append({'existingHomeChoice':'Guide me','route':'/start','passed':True})
 assert not errors,errors;out=Path('/tmp/restore-review-evidence');out.mkdir(exist_ok=True);(out/'existing-routes.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));b.close()
