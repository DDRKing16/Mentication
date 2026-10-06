"""Breadth review of the cumulative product; deep behavioral suites run separately.
JOURNEY_URL=http://127.0.0.1:5191 python qa/whole-app-review-browser.py --out /tmp/whole-pass01
"""
import argparse,json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
parser=argparse.ArgumentParser();parser.add_argument('--out',required=True);args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('JOURNEY_URL','http://127.0.0.1:5191')
CATALOGUE=[('boxV2','Box Breathing'),('progressive-muscle-relaxation-v2','Progressive Muscle Relaxation'),('factCheck','Thought or Fact?'),('urgeSurf','Urge Surfing'),('happyBump','The Happy Bump'),('changeScene','Change the Scene'),('goodMap','The Good Map'),('grounding54321V2','5-4-3-2-1 Grounding'),('vectorShift','Vector Shift'),('nextAction','Next Easiest Step'),('signalLock','Signal Lock'),('tomorrowParking','Tomorrow Parking Lot'),('nightChannel','Night Channel'),('eftTapping','Gentle Tapping'),('selfCompassion','Self-Compassion'),('unhook','Unhook from the Thought'),('makeRoom','Make Room for the Feeling'),('taraTactician','Tara Tactician'),('dear2100','Dear 2100')]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium');report=[];errors=[]
 def open_page():
  c=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');a=c.new_page();a.on('pageerror',lambda e:errors.append(str(e)));a.goto(BASE+'/start');a.evaluate("localStorage.setItem('haven_onboarded','1')");return c,a
 for route in ['/','/start','/library','/plan','/profile','/insights','/return-points','/settings']:
  c,a=open_page();a.goto(BASE+route);a.wait_for_timeout(350);
  if(route=='/'):
   frame=a.frame_locator('iframe');expect(frame.locator('.premium-card')).not_to_be_visible();expect(frame.locator('.journal-card')).not_to_be_visible();expect(frame.locator('.palace-card')).to_be_visible()
  a.screenshot(path=str(out/('host-'+(route.strip('/') or 'home')+'.png')),full_page=route!='/');assert a.evaluate('document.documentElement.scrollWidth<=innerWidth');report.append({'surface':route,'headings':a.get_by_role('heading').all_text_contents(),'route':a.url});c.close()
 for ident,name in CATALOGUE:
  c,a=open_page();a.goto(BASE+'/library');a.get_by_placeholder('Search practices…').fill(name);a.get_by_role('button',name=re.compile('^'+re.escape(name))).first.click();a.wait_for_timeout(350);assert a.evaluate('document.documentElement.scrollWidth<=innerWidth');a.screenshot(path=str(out/(ident+'-entry.png')),full_page=True);report.append({'practice':name,'id':ident,'route':a.url,'headings':a.get_by_role('heading').all_text_contents(),'buttons':a.get_by_role('button').all_text_contents()});c.close()
 c,a=open_page();a.goto(BASE+'/foundations');a.locator('iframe[title="Foundations"]').wait_for();a.screenshot(path=str(out/'foundations-entry.png'),full_page=True);report.append({'practice':'Foundations','route':a.url});c.close()
 assert not errors,errors
 (out/'breadth.json').write_text(json.dumps(report,indent=2));print('PASS 8 host surfaces and all 20 current practice entries, no host overflow or page errors. Screenshots/report:',out);b.close()
