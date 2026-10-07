"""Targeted top-level app reload and joint native history checks; synthetic test inputs."""
import json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('ONE_QUESTION_URL','http://127.0.0.1:5194')
OUT=Path(os.environ.get('ONE_QUESTION_OUT','/tmp/mentication-one-question-standalone'));OUT.mkdir(parents=True,exist_ok=True)
results=[];errors=[];history=[]
def snap(page,label):
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path=str(OUT/(label+'.png')),full_page=True)
    history.append({'label':label,'url':page.url,'state':page.evaluate('history.state')})
def native(page,way):page.evaluate('history.'+way+'()')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--mute-audio'])
 for width in [320,390]:
    context=b.new_context(viewport={'width':width,'height':640 if width==320 else 844},is_mobile=True,has_touch=True,reduced_motion='reduce')
    page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)));page.add_init_script("if(window===window.top)localStorage.setItem('haven_onboarded','1')")
    page.goto(BASE+'/library');page.get_by_role('button',name=re.compile('Night Channel')).first.click()
    frame=page.frame_locator('iframe[title="Night Channel"]')
    expect(frame.get_by_role('heading',name='What would you like to listen to?')).to_be_visible()
    frame.get_by_role('button',name=re.compile('The Night Desk')).click();expect(frame.get_by_role('heading',name='When should the sound stop?')).to_be_visible();frame.get_by_role('button',name='30 minutes',exact=True).click()
    page.wait_for_function("history.state?.['menticationScreen:nightChannel']?.id==='timer'")
    page.reload();expect(frame.get_by_role('heading',name='When should the sound stop?')).to_be_visible();snap(page,f'night-top-reload-timer-{width}')
    native(page,'back');expect(frame.get_by_role('heading',name='What would you like to listen to?')).to_be_visible();snap(page,f'night-top-back-source-{width}')
    native(page,'forward');expect(frame.get_by_role('heading',name='When should the sound stop?')).to_be_visible();expect(frame.get_by_role('button',name='30 minutes',exact=True)).to_have_attribute('aria-pressed','true');snap(page,f'night-top-forward-timer-{width}')
    frame.get_by_role('button',name='Tune In',exact=True).click();expect(frame.get_by_role('button',name='Pause',exact=True)).to_be_visible()
    page.wait_for_function("history.state?.['menticationScreen:nightChannel']?.id==='listening'")
    page.reload();expect(frame.get_by_role('button',name='Play',exact=True)).to_be_visible();snap(page,f'night-top-reload-listening-paused-{width}')
    native(page,'back');expect(frame.get_by_role('heading',name='When should the sound stop?')).to_be_visible();snap(page,f'night-top-back-timer-{width}')
    native(page,'forward');expect(frame.get_by_role('button',name='Play',exact=True)).to_be_visible();snap(page,f'night-top-forward-listening-paused-{width}')
    native(page,'back');expect(frame.get_by_role('heading',name='When should the sound stop?')).to_be_visible()
    native(page,'back');expect(frame.get_by_role('heading',name='What would you like to listen to?')).to_be_visible()
    native(page,'back');expect(page.get_by_role('heading',name='Find your way in.',exact=True)).to_be_visible();snap(page,f'night-top-back-library-{width}')
    native(page,'forward');expect(frame.get_by_role('heading',name='What would you like to listen to?')).to_be_visible();snap(page,f'night-top-forward-from-library-{width}')
    state=page.evaluate("history.state['menticationScreen:nightChannel']")
    assert set(state)=={'id','cursors','depth'} and state['cursors']=={} and state['id']=='source'
    results.append(f'Night {width}: top-level app reload at timer/listening; native Back/Forward visibly restores source/timer/paused listening; final Back exits to Library and Forward returns; selected 30 minutes retained; only coarse cursor in host history')
    # Signal never creates child history entries. Back returns to host; Forward resumes valid progress.
    page.goto(BASE+'/library');page.get_by_role('button',name=re.compile('Signal Lock')).first.click();signal=page.frame_locator('iframe[title="Signal Lock"]')
    signal.get_by_role('button',name='Follow the signal').click();signal.locator('#target-one').click();signal.locator('#target-two').click();signal.get_by_role('button',name='Pause',exact=True).click()
    page.reload();expect(signal.get_by_role('button',name='Continue the signal')).to_be_visible();snap(page,f'signal-top-reload-paused-{width}')
    native(page,'back');expect(page.get_by_role('heading',name='Find your way in.',exact=True)).to_be_visible();snap(page,f'signal-top-back-library-{width}')
    native(page,'forward');expect(signal.get_by_role('button',name='Continue the signal')).to_be_visible();signal.get_by_role('button',name='Continue the signal').click();signal.get_by_role('button',name='Stop here',exact=True).click();expect(signal.locator('#summary-detail')).to_contain_text('1 connection');snap(page,f'signal-top-forward-retained-{width}')
    results.append(f'Signal {width}: top-level reload paused; native Back visibly returns to Library; Forward restores the actual earned connection paused')
    # Vector remains in the shared answered-baseline session and its original game state.
    page.goto(BASE+'/library');page.get_by_role('button',name=re.compile('Vector Shift')).first.click();page.get_by_role('slider').fill('4');page.get_by_role('button',name='Start Vector Shift',exact=True).click();vector=page.frame_locator('iframe[title="Vector Shift activities"]')
    vector.get_by_role('button',name='Tap here to begin').click();vector.get_by_text('Activity options',exact=True).click();vector.get_by_role('button',name='Try an easier option').click();vector.get_by_role('button',name=re.compile('I noticed a colour')).click()
    for _ in range(3):vector.get_by_role('button',name=re.compile('Collect a light')).click()
    vector.get_by_role('button',name='Reveal a letter',exact=True).click();vector.get_by_role('button',name='Pause',exact=True).click()
    page.reload();expect(vector.get_by_role('button',name='Resume',exact=True)).to_be_visible();snap(page,f'vector-top-reload-paused-{width}')
    native(page,'back');expect(page.locator('iframe[title="Vector Shift activities"]')).to_have_count(0);snap(page,f'vector-top-back-host-{width}')
    native(page,'forward');expect(vector.get_by_role('button',name='Resume',exact=True)).to_be_visible();vector.get_by_role('button',name='Resume',exact=True).click();expect(vector.get_by_role('heading',name='Choose a letter to uncover the word.')).to_be_visible();assert vector.locator('button:disabled').count()>0;snap(page,f'vector-top-forward-word-retained-{width}')
    results.append(f'Vector {width}: real baseline and easy gameplay; whole-app reload paused; native Back visibly leaves iframe for host, Forward restores word gameplay and actual chosen letter')
    context.close()
 b.close()
assert not errors,errors
OUT.joinpath('whole-app-history-results.json').write_text(json.dumps({'results':results,'errors':errors,'history':history},indent=2)+'\n')
for result in results:print('PASS '+result,flush=True)
