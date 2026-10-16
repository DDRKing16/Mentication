"""Real Chromium audio clocks and muted output; does not certify iPhone haptics."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path(os.environ.get('TAPPING_EVIDENCE_DIR','/tmp/mentation-evidence/production-cues'));out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--mute-audio'])
 a=b.new_page(viewport={'width':390,'height':844});errors=[];requests=[]
 a.on('pageerror',lambda e:errors.append(str(e)));a.on('request',lambda r:requests.append(r.url))
 a.add_init_script("""if(window===window.top){localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({ambientSoundscape:true}));history.replaceState({usr:{prebuilt:true,pathway:['eftTapping'],direction:'ground',audio:'no',reset_phase:'guiding'},key:'cues',idx:0},'',location.href)}
 window.audioContexts=[];const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.audioContexts.push(this)}};
 """)
 a.goto(os.environ.get('TAPPING_URL','http://127.0.0.1:5192/reset'))
 def click(s):a.get_by_role('button',name=s,exact=True).click();a.wait_for_timeout(300)
 click('A worry');click('Skip this rating');click('Adjust pace or cues');a.locator('.tap-setting-menu button').filter(has_text='Voice').click();expect(a.get_by_role('button',name='Voice guidance',exact=True)).to_be_disabled();click('Back to my round');click('Start guided round')
 a.locator('.tap-finger-rig.is-tapping').wait_for(timeout=20000)
 transforms=[]
 for _ in range(5):
  transforms.append(a.locator('.tap-finger-rig').evaluate('e=>getComputedStyle(e).transform'));a.wait_for_timeout(110)
 assert len(set(transforms))>1,'Fingers actually move'
 assert not [url for url in requests if '/media/tapping/audio/' in url and not url.endswith(('contact.mp3','warm-room.mp3'))],'Never fetch legacy speech'
 click('Mute audio');expect(a.get_by_role('button',name='Turn sound on',exact=True)).to_be_visible();click('Turn sound on');expect(a.get_by_role('button',name='Mute audio',exact=True)).to_be_visible()
 click('Pause');expect(a.locator('.tap-finger-rig.is-tapping')).to_have_count(0);s=a.evaluate("JSON.parse(localStorage.getItem('mentation.eftTapping.draft.v1')).second");a.wait_for_timeout(1200);assert a.evaluate("JSON.parse(localStorage.getItem('mentation.eftTapping.draft.v1')).second")==s
 click('Resume my round');a.locator('.tap-finger-rig.is-tapping').wait_for();a.evaluate('audioContexts.at(-1).suspend()');expect(a.get_by_role('button',name='Resume my round',exact=True)).to_be_visible();expect(a.locator('.tap-finger-rig.is-tapping')).to_have_count(0)
 click('Resume my round');click('Skip this point');expect(a.get_by_role('heading',name='Top of head',exact=True)).to_be_visible();a.reload();expect(a.get_by_role('button',name='Resume my round',exact=True)).to_be_visible();click('Resume my round');click('Stop round');click('Skip this rating')
 a.screenshot(path=str(out/'stopped-no-comparison.png'),full_page=True)
 state=a.evaluate("JSON.parse(localStorage.getItem('mentation.eftTapping.draft.v1'))");assert state['rounds']==0 and state['skipped']==1 and state['after'] is None
 assert not errors,errors
 (out/'results.json').write_text(json.dumps({'movingTransforms':transforms,'missingVoiceDisabled':True,'noLegacySpeechRequests':True,'muteUnmute':True,'pauseResume':True,'audioInterruptionPauses':True,'skipRefreshStop':True,'errors':errors},indent=2));print('PASS actual moving fingers, voice unavailable, music/beat activation, mute/unmute, pause, AudioContext suspension, skip/refresh/stop; output muted')
 b.close()
