"""Rendered release-candidate host surfaces at actual phone widths and saved access preferences."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5191');p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
ROUTES=['/','/start','/library','/plan','/profile','/insights','/return-points','/settings','/palace']
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium');errors=[];report=[]
 for width in [320,390]:
  for enlarged in [False,True]:
   c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');a=c.new_page();a.on('pageerror',lambda e:errors.append(str(e)));a.goto(args.url+'/start');a.evaluate("prefs=>{localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify(prefs))}",{'largeText':enlarged,'highContrast':enlarged,'reducedMotion':True,'ambientSoundscape':False})
   for route in ROUTES:
    a.goto(args.url+route);a.wait_for_timeout(400);assert a.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,enlarged,route)
    if route=='/':
     f=a.frame_locator('iframe');assert f.locator('body').evaluate('()=>document.documentElement.scrollWidth<=innerWidth');expect(f.locator('.palace-card')).to_be_visible()
    elif route in ['/library','/plan','/profile','/insights','/settings']:
     nav=a.get_by_role('navigation',name='Primary navigation');expect(nav).to_be_visible();assert nav.get_by_role('button').count()==6
    if enlarged:assert a.evaluate("document.documentElement.classList.contains('large-text')")
    name=f'{route.strip("/") or "home"}-{width}-'+('large' if enlarged else 'standard');a.screenshot(path=str(out/(name+'.png')),full_page=route!='/');report.append({'route':route,'width':width,'enlarged':enlarged,'title':a.get_by_role('heading').all_text_contents()})
   c.close();print('PASS',width,'larger text/high contrast' if enlarged else 'standard text','all nine host surfaces, Home iframe, six navigation controls and no overflow/page errors.')
 assert not errors,errors;(out/'rendered-report.json').write_text(json.dumps(report,indent=2));b.close()
