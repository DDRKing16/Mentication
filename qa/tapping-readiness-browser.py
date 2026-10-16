import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path(os.environ.get('TAPPING_EVIDENCE_DIR','/tmp/mentation-evidence/tapping'));out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--mute-audio'])
 a=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');errors=[];a.on('pageerror',lambda e:errors.append(str(e)));a.add_init_script("if(window===window.top){localStorage.setItem('haven_onboarded','1');history.replaceState({usr:{prebuilt:true,pathway:['eftTapping'],direction:'ground',audio:'no',reset_phase:'guiding',goal_baseline:{question:'How intense is it right now?',scale:'distress',higherIsBetter:false,direction:'ground',min:0,max:10,value:6,answered:true}},key:'readiness',idx:0},'',location.href)}");a.goto(os.environ.get('TAPPING_URL','http://127.0.0.1:5192/reset'));a.clock.install();a.wait_for_timeout(400)
 def click(s):
  a.get_by_role('button',name=s,exact=True).click();a.wait_for_timeout(300)
 def tick(n):
  for _ in range(n):a.clock.fast_forward(1000);a.get_by_role('heading',level=1).text_content()
 def state():return a.evaluate("JSON.parse(localStorage.getItem('mentation.eftTapping.draft.v1'))")
 click('A worry');click('6 out of 10');
 if a.get_by_role('button',name='Mute before starting',exact=True).is_enabled():click('Mute before starting')
 click('Start quiet round');print('Started quiet round',flush=True);seen=[]
 for round in range(2):
  for index in range(9):
   assert state()['index']==index
   name=a.get_by_role('heading',level=1).inner_text();seen.append(name);print(round,index,name,flush=True)
   if round==0 and index==2:
    click('Pause');s=state()['second'];tick(5);assert state()['second']==s;click('Resume my round')
   for _ in range(70):
    tick(1)
    if state()['index']!=index or state()['stage']=='after':break
   else:raise Exception('Point did not progress '+name)
   if round==0:a.screenshot(path=str(out/f'point-{index}.png'))
  assert state()['rounds']==round+1
  click('6 out of 10' if round==0 else '8 out of 10')
  if round==0:click('Other next steps');click('Try another gentle round')
 assert 'higher' in a.locator('.tap-result').inner_text().lower()
 a.screenshot(path=str(out/'worse-after-two-rounds.png'))
 click('Finish');click('Skip and finish');a.wait_for_function("JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length===1");result=a.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))[0].intervention_outcome");assert result['roundsCompleted']==2 and result['after']==8
 assert len(set(seen))==9 and not errors,errors
 (out/'results.json').write_text(json.dumps({'allPointsTwoRounds':seen,'result':result,'errors':errors},indent=2));print('PASS all nine targets, two full rounds, pause/resume, unchanged then worse, honest completion',flush=True)
 b.close()
