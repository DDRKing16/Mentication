"""Measure real audio elements on baseline and changed production builds."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
OUT=Path(os.environ.get('EVIDENCE_DIR','/tmp/dear-threat-evidence'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--autoplay-policy=no-user-gesture-required']);report=[]
 for base,gain in [(os.environ.get('BEFORE_URL','http://127.0.0.1:5197'),.35),(os.environ.get('BASE_URL','http://127.0.0.1:5196'),.175)]:
  c=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');c.add_init_script("try{localStorage.setItem('haven_onboarded','1')}catch{};window.createdAudio=[];window.Audio=new Proxy(Audio,{construct(Target,args){const a=new Target(...args);window.createdAudio.push(a);return a;}})");a=c.new_page();a.goto(base+'/')
  a.wait_for_function("createdAudio.some(a=>a.src.endsWith('/home-ambient.mp3')&&!a.paused)");a.evaluate("window.homeAudio=createdAudio.find(a=>a.src.endsWith('/home-ambient.mp3'));homeAudio.currentTime=25")
  def read():return a.evaluate('({volume:homeAudio.volume,time:homeAudio.currentTime,paused:homeAudio.paused,muted:homeAudio.muted})')
  before=read();assert before['volume']==gain
  a.get_by_role('button',name='Mute home music',exact=True).click();muted=read();assert muted['paused'] and muted['muted'];a.wait_for_timeout(200);assert abs(read()['time']-muted['time'])<.1
  a.get_by_role('button',name='Unmute home music',exact=True).click();a.wait_for_function('!homeAudio.paused');assert read()['time']>=25 and read()['volume']==gain
  a.frame_locator('iframe').locator('[data-route=calm]').click();expect(a.get_by_role('heading',name='How intense is it right now?',exact=True)).to_be_visible();assert not read()['paused'];a.get_by_role('button',name='7',exact=True).click();a.get_by_role('button',name='Continue',exact=True).click();expect(a.get_by_role('heading',name='How much time do you have?',exact=True)).to_be_visible();assert not read()['paused'];a.get_by_role('combobox',name='Time available',exact=True).select_option('15');a.get_by_role('button',name='Build my reset',exact=True).click();expect(a.get_by_role('button',name='Begin',exact=True)).to_be_visible(timeout=20000);setup=read();assert not setup['paused'] and setup['time']>=25 and setup['volume']==gain
  a.get_by_role('button',name='Begin',exact=True).click();a.wait_for_function('homeAudio.paused');begun=read();assert begun['volume']==gain
  # A separate direct document still uses the same reduced gain.
  direct=c.new_page();direct.goto(base+'/home.html');expect(direct.locator('#bg-music')).to_have_count(1);directGain=direct.locator('#bg-music').evaluate('(a)=>a.volume');assert directGain==gain
  report.append({'url':base,'home':before,'muted':muted,'setupBeforeBegin':setup,'afterBegin':begun,'standaloneHomeVolume':directGain});print('PASS',report[-1],flush=True);c.close()
 assert report[1]['home']['volume']==report[0]['home']['volume']/2
 (OUT/'audio-comparison.json').write_text(json.dumps(report,indent=2));b.close()
