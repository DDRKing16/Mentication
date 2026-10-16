"""Muted production timed acceptance; simulated time is explicit, no completion injection."""
import argparse,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5192');p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report=[];errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--mute-audio'])
 for width in [320,390]:
  c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');a=c.new_page();a.on('pageerror',lambda e:errors.append(str(e)))
  a.goto(args.url+'/night-channel/index.html');a.get_by_role('button',name=re.compile('Rainy Day')).click();a.get_by_role('button',name='15 minutes',exact=True).click();a.get_by_role('button',name='Tune In',exact=True).click();expect(a.locator('.night-controls')).to_contain_text('playing');a.clock.install()
  # Each interval runs, including the final-minute fade and stop. Audio output is muted.
  for _ in range(15):a.clock.run_for(60000)
  expect(a.locator('.night-controls')).to_have_attribute('data-remaining','0');expect(a.locator('.night-controls')).to_contain_text('stopped');a.screenshot(path=str(out/f'night-ended-{width}.png'))
  report.append({'practice':'Night Channel','width':width,'simulatedMinutes':15,'timerEnded':True});print('PASS Night',width,'15 simulated minutes run through production timer; no completion injected',flush=True);c.close()
  c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');a=c.new_page();a.on('pageerror',lambda e:errors.append(str(e)));a.add_init_script("if(window===window.top){localStorage.setItem('haven_onboarded','1');history.replaceState({usr:{prebuilt:true,pathway:['boxV2'],direction:'calm',audio:'no',reset_phase:'guiding'},key:'box',idx:0},'',location.href)}")
  a.goto(args.url+'/reset');a.get_by_role('button',name='6',exact=True).click();a.get_by_role('button',name='Start Box Breathing',exact=True).click();expect(a.get_by_role('button',name='Pause',exact=True)).to_be_visible();a.clock.install()
  # Keep RAF gaps below the interruption threshold; exercise actual progress, not snapshots.
  for _ in range(110):
   a.clock.run_for(1000)
   if a.get_by_role('heading',name='Was Box Breathing helpful?',exact=True).count():break
  expect(a.get_by_role('heading',name='Was Box Breathing helpful?',exact=True)).to_be_visible();a.get_by_role('button',name='Felt worse' if width==320 else 'No change',exact=True).click()
  a.get_by_role('button',name='Continue',exact=True).click();a.get_by_role('button',name='Skip and finish',exact=True).click();a.wait_for_function("JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length===1");record=a.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))[0]");assert record['attempts'][0]['completed_percentage']==1 and record['intensity_end'] is None;print('PASS Box',width,'full four-round timer, explicit same/worse feedback, honest complete history and blank endpoint',flush=True)
  report.append({'practice':'Box Breathing','width':width,'simulatedClock':True,'fullTimedPractice':True});a.screenshot(path=str(out/f'box-ended-{width}.png'));c.close()
  c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');a=c.new_page();a.on('pageerror',lambda e:errors.append(str(e)));a.goto(args.url+'/signal-lock/index.html');a.get_by_role('button',name='Follow the signal',exact=True).click()
  for _ in range(12):
   expect(a.locator('#target-two')).to_be_disabled();a.locator('#target-one').click();expect(a.locator('#target-one')).to_be_disabled();a.locator('#target-two').click()
  a.get_by_role('button',name='Finish this scene',exact=True).click();expect(a.locator('#summary-title')).to_have_text('Scene completed');expect(a.locator('#summary-detail')).to_contain_text('12 connections made · 2 scenes connected.');a.get_by_role('button',name='More difficult' if width==320 else 'About the same',exact=True).click();a.reload();expect(a.locator('#summary-detail')).to_contain_text('12 connections made · 2 scenes connected.');expect(a.locator('#feelings button[aria-pressed=true]')).to_have_text('More difficult' if width==320 else 'About the same');a.screenshot(path=str(out/f'signal-complete-{width}.png'));report.append({'practice':'Signal Lock','width':width,'actualPairs':12,'completedScenes':2,'outcomeRetained':True});print('PASS Signal',width,'12 real connections, 2 complete scenes, same/worse outcome retained on refresh',flush=True);c.close()
 assert not errors,errors;b.close()
(out/'results.json').write_text(json.dumps({'checks':report,'errors':errors},indent=2))
