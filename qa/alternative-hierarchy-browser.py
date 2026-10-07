"""Render every active journey at 320/390px and verify secondary alternatives.

JOURNEY_URL=http://127.0.0.1:5191 python qa/alternative-hierarchy-browser.py --out /tmp/alternatives
"""
import argparse,json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

p=argparse.ArgumentParser();p.add_argument('--out',required=True);args=p.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('JOURNEY_URL','http://127.0.0.1:5191')
CATALOGUE=[('boxV2','Box Breathing'),('progressive-muscle-relaxation-v2','Progressive Muscle Relaxation'),('factCheck','Thought or Fact?'),('urgeSurf','Urge Surfing'),('happyBump','The Happy Bump'),('changeScene','Change the Scene'),('goodMap','The Good Map'),('grounding54321V2','5-4-3-2-1 Grounding'),('vectorShift','Vector Shift'),('nextAction','Next Easiest Step'),('signalLock','Signal Lock'),('tomorrowParking','Tomorrow Parking Lot'),('nightChannel','Night Channel'),('eftTapping','Gentle Tapping'),('selfCompassion','Self-Compassion'),('unhook','Unhook from the Thought'),('makeRoom','Make Room for the Feeling'),('taraTactician','Let’s get through this'),('dear2100','Dear 2100'),('foundations','Foundations')]
report=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium')
 for width in [320,390]:
  for ident,name in CATALOGUE:
   c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');page=c.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE+'/start');page.evaluate("localStorage.setItem('haven_onboarded','1')")
   if ident=='foundations':page.goto(BASE+'/foundations')
   else:
    page.goto(BASE+'/library');page.get_by_placeholder('Search practices…').fill(name)
    page.get_by_role('button',name=re.compile('^'+re.escape(name))).first.click()
    page.wait_for_timeout(400)
    if page.get_by_role('slider').count():
     page.get_by_role('slider').first.fill('4')
     next_check=page.get_by_role('button',name='Continue',exact=True)
     if next_check.count():next_check.click()
     distress=page.get_by_role('combobox',name='Current distress',exact=True)
     if distress.count():distress.select_option('4')
     if ident=='factCheck':
      page.get_by_role('button',name='Continue to your thought',exact=True).click()
      page.get_by_role('textbox',name='The thought you want to examine',exact=True).fill('Synthetic thought for mobile hierarchy review.')
      page.get_by_role('button',name='Continue',exact=True).click()
     else:
      if distress.count():
       advance=page.get_by_role('button',name='Continue',exact=True)
       if advance.count():advance.click()
      time=page.get_by_role('button',name='5 min',exact=True)
      if time.count():time.click()
      page.get_by_role('button',name=re.compile('^(Start |Build my reset$)')).click()
     page.wait_for_function("""()=>[...document.querySelectorAll('button')].some(b=>b.getBoundingClientRect().height>0&&(b.classList.contains('journey-options-button')||b.textContent.trim()==='Begin'))""",timeout=25000)
     begin=page.get_by_role('button',name='Begin',exact=True)
     if begin.count():begin.click()
   options=page.locator('.journey-options-button:visible');expect(options).to_have_count(1,timeout=25000)
   button=options.first
   page.wait_for_timeout(500)
   # These controls must follow native content or the preserved standalone build.
   result=button.evaluate("""el=>{
    const frames=[...document.querySelectorAll('iframe')].filter(f=>f.getBoundingClientRect().height>0);
    const titles=[...document.querySelectorAll('h1,h2')].filter(h=>h.getBoundingClientRect().height>0);
    const content=frames[0]||titles[0];const style=getComputedStyle(el);
    return {afterContent:!!content&&!!(content.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING),height:el.getBoundingClientRect().height,border:style.borderTopWidth,underline:style.textDecorationLine,content:content?.tagName};
   }""")
   assert result['afterContent'],(ident,width,result)
   assert result['height']>=44,(ident,width,result)
   assert result['border']=='0px' and 'underline' in result['underline'],(ident,width,result)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(ident,width,'overflow')
   page.screenshot(path=str(out/f'{ident}-entry-{width}.png'),full_page=True)
   button.scroll_into_view_if_needed();button.click()
   dialog=page.get_by_role('dialog',name=re.compile('^Another way · '))
   expect(dialog).to_be_visible()
   dialog.evaluate("el=>{el.dataset.hierarchyTest='still-mounted'}")
   page.keyboard.press('Tab');assert dialog.evaluate('el=>el.contains(document.activeElement)')
   page.screenshot(path=str(out/f'{ident}-alternative-{width}.png'))
   dialog.get_by_role('button',name=re.compile('^Return to ')).click()
   expect(dialog).not_to_be_visible();expect(button).to_be_focused()
   snapshot=page.evaluate("""()=>({route:location.href,headings:[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent)})""")
   page.go_back()
   # Existing flow history can return to a prior check-in, overview or Library.
   page.wait_for_function("""before=>location.href!==before.route||JSON.stringify([...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent))!==JSON.stringify(before.headings)""",arg=snapshot)
   assert not errors,(ident,width,errors)
   report.append({'id':ident,'name':name,'width':width,**result,'route':page.url,'alternativeReturn':True,'browserBack':True})
   (out/'hierarchy.json').write_text(json.dumps(report,indent=2));print('PASS',ident,width,flush=True)
   c.close()
 b.close()
assert len(report)==40
print('PASS all 20 journeys at both mobile widths: content first, quiet 44px alternatives, no overflow, contained dialog focus and return.')
