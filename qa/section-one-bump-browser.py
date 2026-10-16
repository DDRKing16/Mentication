"""Muted Happy Bump: confirmed actions, lower/unchanged/unrated energy and saved cues."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:5192');p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--mute-audio'])
 for width,start,end in [(320,6,3),(390,6,6),(320,None,None)]:
  c=b.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');a=c.new_page();a.on('pageerror',lambda e:errors.append(str(e)));a.add_init_script("if(window===window.top&&!sessionStorage.getItem('bump-seeded')){sessionStorage.setItem('bump-seeded','1');localStorage.setItem('haven_onboarded','1');history.replaceState({usr:{prebuilt:true,pathway:['happyBump'],direction:'lift',audio:'no',reset_phase:'guiding'},key:'bump',idx:0},'',location.href)}");a.goto(args.url+'/reset');a.get_by_role('button',name='6',exact=True).click();a.get_by_role('button',name='Continue',exact=True).click();a.get_by_role('combobox',name='Current distress').select_option('4');a.get_by_role('button',name='Start The Happy Bump',exact=True).click()
  def click(name):a.wait_for_timeout(300);a.get_by_role('button',name=name,exact=True).click();a.wait_for_timeout(300)
  def state():return a.evaluate("JSON.parse(localStorage.getItem('mentation.flagship.active.v1')).experience")
  click('Start')
  if start is None:click('Skip ahead')
  else:a.get_by_role('slider',name='Energy from flat to more alive').fill(str(start));click('Confirm energy: '+str(start))
  click("I've had some water");click('I did that');click('1 min');click('Walk indoors');a.wait_for_timeout(1200);click('Pause');elapsed=state()['elapsedBeforePause'];a.reload();expect(a.get_by_role('heading',name='Paused.',exact=True)).to_be_visible();assert state()['elapsedBeforePause']==elapsed;click('I took a shorter walk');click('Skip ahead')
  # Select an authored action, then explicitly confirm an honest start.
  expect(a.get_by_role('heading',name='One small win.')).to_be_visible();a.locator('.happy-bump-task-list button').first.click();a.wait_for_timeout(300);click('I made an honest start');click('Skip ahead')
  for _ in range(10):
   if state()['scene']=='rerate':break
   click('Skip ahead')
  assert state()['scene']=='rerate'
  if end is None:click('Skip ahead')
  else:a.get_by_role('slider',name='Energy from flat to more alive').fill(str(end));click('Confirm energy: '+str(end))
  click('Felt worse' if end==3 else 'No change');expect(a.get_by_role('heading',name='A moment to check in.')).to_be_visible();expect(a.get_by_text('Energy change not measured' if end is None else f'Energy {start} → {end} · {end-start} points',exact=True)).to_be_visible();assert state()['walkStatus']=='started' and state()['taskStatus']=='started' and state()['contactStatus'] is None
  a.reload();expect(a.get_by_role('heading',name='A moment to check in.')).to_be_visible();a.locator('.happy-bump-content details.journey-takeaway > summary').click();field=a.get_by_role('textbox');field.fill('Synthetic cue: a smaller step is enough.');click('Save on this device');expect(a.get_by_role('status').filter(has_text='Saved on this device.')).to_be_visible();click('Back to practice');assert a.evaluate('document.documentElement.scrollWidth<=innerWidth');a.screenshot(path=str(out/f'bump-{width}-{end}.png'));click('Done');expect(a.get_by_role('button',name='Skip mood rating',exact=True)).to_be_visible();click('Finish here');a.wait_for_function("JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]').length===1");record=a.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))[0]");assert record['intensity_end'] is None;assert 'Synthetic cue' not in json.dumps(record);a.goto(args.url+'/return-points');expect(a.get_by_text('Synthetic cue: a smaller step is enough.',exact=True)).to_be_visible();click('Delete this note');a.reload();expect(a.get_by_text('Synthetic cue: a smaller step is enough.',exact=True)).to_have_count(0);checks.append({'width':width,'energyStart':start,'energyEnd':end,'record':record});print('PASS Happy Bump',width,start,end,'paused walk restored, partial actions honest, saved cue/delete, blank shared endpoint',flush=True);c.close()
 assert not errors,errors;b.close()
(out/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2))
