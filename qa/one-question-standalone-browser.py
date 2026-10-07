import json, os, subprocess, re, io, wave
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
REPO=Path(__file__).resolve().parents[1]
BASE=os.environ.get('ONE_QUESTION_URL','http://127.0.0.1:5194'); OUT=Path(os.environ.get('ONE_QUESTION_OUT','/tmp/mentication-one-question-standalone'));  OUT.mkdir(parents=True,exist_ok=True); RESULTS=[]; ERRORS=[]
def note(message): RESULTS.append(message); print('PASS '+message,flush=True)
def snap(page,name):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),name
    page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
def answer(page,text): page.get_by_role('button',name=text,exact=True).click()
def raw(page,route): page.goto(BASE+route);expect(page.locator('body')).not_to_be_empty()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--mute-audio'])
    for width in [320,390]:
        context=browser.new_context(viewport={'width':width,'height':640 if width==320 else 844},is_mobile=True,has_touch=True,reduced_motion='reduce')
        page=context.new_page();page.on('pageerror',lambda error:ERRORS.append(str(error)))
        # Before evidence is the exact released source, delivered at the same origin.
        originals={f'/night-channel/index.html': 'public/night-channel/index.html',f'/vector-shift/index.html':'public/vector-shift/index.html', '/signal-lock/index.html':'public/signal-lock/index.html','/signal-lock/app.js':'public/signal-lock/app.js','/signal-lock/styles.css':'public/signal-lock/styles.css'}
        def old(route):
            from urllib.parse import urlparse
            file=originals.get(urlparse(route.request.url).path)
            if file: route.fulfill(body=subprocess.check_output(['git','show','b4f406c9:'+file],cwd=REPO),content_type='text/html' if file.endswith('.html') else 'text/css' if file.endswith('.css') else 'text/javascript')
            else: route.continue_()
        page.route('**/*',old)
        for key,route in [('night','/night-channel/index.html'),('signal','/signal-lock/index.html'),('vector','/vector-shift/index.html?session=before')]:
            raw(page,route);page.wait_for_timeout(250);snap(page,f'{key}-before-{width}')
        page.unroute('**/*',old);context.close()
        context=browser.new_context(viewport={'width':width,'height':640 if width==320 else 844},is_mobile=True,has_touch=True,reduced_motion='reduce')
        page=context.new_page();page.on('pageerror',lambda error:ERRORS.append(str(error)))
        raw(page,'/night-channel/index.html');expect(page.get_by_role('heading',name='What would you like to listen to?')).to_be_visible();snap(page,f'night-source-after-{width}')
        page.keyboard.press('Tab');assert page.locator(':focus strong').inner_text()=='The Night Desk'
        page.keyboard.press('Enter');expect(page.get_by_role('heading',name='When should the sound stop?')).to_be_visible();answer(page,'30 minutes');expect(page.get_by_role('button',name='30 minutes')).to_have_attribute('aria-pressed','true');snap(page,f'night-timer-after-{width}')
        assert page.evaluate("JSON.parse(sessionStorage.getItem('mentation.nightChannel.setup.v1')).minutes")==30
        # Browser Back and explicit Back keep the choice; no sound has started.
        page.go_back();expect(page.get_by_role('heading',name='What would you like to listen to?')).to_be_visible();expect(page.get_by_role('button',name=re.compile('The Night Desk'))).to_have_attribute('aria-pressed','true')
        page.get_by_role('button',name=re.compile('The Night Desk')).click();expect(page.get_by_role('button',name='30 minutes')).to_have_attribute('aria-pressed','true');page.reload();expect(page.get_by_role('heading',name='When should the sound stop?')).to_be_visible();expect(page.get_by_role('button',name='30 minutes')).to_have_attribute('aria-pressed','true')
        answer(page,'Tune In');expect(page.get_by_role('button',name='Pause',exact=True)).to_be_visible();assert page.get_by_role('slider').count()==0 and page.locator('input[type=range]').count()==2;snap(page,f'night-listening-after-{width}')
        answer(page,'Pause');expect(page.get_by_role('button',name='Play',exact=True)).to_be_visible();page.reload();expect(page.get_by_role('button',name='Play',exact=True)).to_be_visible();assert 'paused' in page.locator('.night-controls').inner_text()
        page.get_by_text('Adjust sound or stop time',exact=True).click();page.get_by_role('combobox',name='Sleep timer').select_option('45');page.get_by_role('slider',name='Local audio volume').fill('0.3');page.get_by_text('Adjust sound or stop time',exact=True).click()
        page.get_by_text('Keep this setup · optional',exact=True).click();answer(page,'Save setup note on this device');expect(page.get_by_text('Saved setup note on this device.',exact=True)).to_be_visible()
        saved=page.evaluate("JSON.parse(localStorage.getItem('mentation.takeaways.v1'))");assert saved is not None
        answer(page,'Finish by choice');expect(page.get_by_role('heading',name='You can leave it here')).to_be_visible();expect(page.get_by_role('button',name='Play',exact=True)).not_to_be_visible();snap(page,f'night-finish-after-{width}');answer(page,'Return to controls')
        # Changing source pauses first and introduces a required file screen, rather than hidden required controls.
        answer(page,'Change');expect(page.get_by_role('heading',name='What would you like to listen to?')).to_be_visible()
        page.get_by_role('button',name=re.compile('Documentary')).click();expect(page.get_by_role('heading',name='Add your recording')).to_be_visible();assert page.get_by_role('button',name='Tune In').count()==0;snap(page,f'night-file-after-{width}')
        buf=io.BytesIO()
        with wave.open(buf,'wb') as wav: wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(8000);wav.writeframes(b'\0\0'*8000)
        page.locator('input[type=file]').set_input_files({'name':'synthetic-test.wav','mimeType':'audio/wav','buffer':buf.getvalue()});expect(page.get_by_role('heading',name='When should the sound stop?')).to_be_visible();page.go_back();expect(page.get_by_role('heading',name='Use your attached recording')).to_be_visible();answer(page,'Continue with this recording');expect(page.get_by_role('heading',name='When should the sound stop?')).to_be_visible();page.reload();expect(page.get_by_role('heading',name='Add your recording')).to_be_visible()
        answer(page,'Back to sounds');page.get_by_text('Use a music app instead',exact=True).click();answer(page,'Spotify');expect(page.get_by_role('heading',name='Connect Spotify')).to_be_visible();assert page.get_by_role('textbox').count()==0;expect(page.get_by_role('button',name='Choose another sound')).to_be_enabled();assert page.get_by_role('heading',name='What would you like to listen to?').count()==0;snap(page,f'night-provider-after-{width}');answer(page,'Choose another sound')
        # Released records migrate in place; non-persisted files/provider grants must be restored explicitly.
        for kind,source,channel,heading in [('file','local','documentary','Add your recording'),('provider','spotify','night-desk','Connect Spotify')]:
            page.add_init_script("sessionStorage.setItem('mentation.nightChannel.setup.v1',"+json.dumps(json.dumps({'version':1,'expiresAt':9999999999999,'channel':channel,'minutes':30,'seconds':1613,'source':source,'kind':kind,'view':True,'volume':.3,'texture':.2,'noteId':None}))+")")
            page.reload();expect(page.get_by_role('heading',name=heading,exact=True)).to_be_visible();assert page.get_by_role('button',name='Play',exact=True).count()==0
            assert page.evaluate("JSON.parse(sessionStorage.getItem('mentation.nightChannel.setup.v1')).seconds")==1613
            snap(page,f'night-legacy-{kind}-after-{width}')
        note(f'Night {width}: one sound/file/timer step, keyboard, browser Back, explicit Back, refresh paused, real generated playback, optional settings/save, invalidated file reattachment and honest unavailable provider')
        # Existing local first Signal play: one target enabled at a time, no quiz.
        raw(page,'/signal-lock/index.html');expect(page.locator('#instruction')).to_be_visible();assert page.locator('#instruction').bounding_box()['y'] < page.locator('.scene').bounding_box()['y'];snap(page,f'signal-entry-after-{width}')
        answer(page,'Follow the signal');expect(page.locator('#target-one')).to_be_enabled();expect(page.locator('#target-two')).to_be_disabled();page.locator('#target-one').press('Enter');expect(page.locator('#target-two')).to_be_enabled();page.locator('#target-two').press('Enter');answer(page,'Pause');page.reload();expect(page.get_by_role('button',name='Continue the signal')).to_be_visible();answer(page,'Continue the signal');answer(page,'Stop here');expect(page.get_by_text('How does this moment feel?',exact=True)).to_be_visible();assert not page.locator('.scene').is_visible();snap(page,f'signal-feeling-after-{width}')
        choices=page.locator('#feelings button');choices.first.click();chosen=choices.first.inner_text();page.reload();expect(page.locator('#feelings button[aria-pressed=true]')).to_have_text(chosen);answer(page,'Begin another scene');expect(page.get_by_role('button',name='Follow the signal')).to_be_visible()
        note(f'Signal {width}: original scene/alternating targets, prominent one instruction, keyboard, pause/reload/repeat and retained optional closing feeling')
        # Vector real click-only easy games; independent questions follow each other.
        raw(page,f'/vector-shift/index.html?session=question-{width}&audio=off');answer(page,'Tap here to begin');expect(page.get_by_role('heading',name='Drag the star into the ring.')).to_be_visible();snap(page,f'vector-align-after-{width}')
        page.get_by_text('Activity options',exact=True).click();answer(page,'Try an easier option');page.get_by_role('button',name=re.compile('I noticed a colour')).click()
        for _ in range(3):page.get_by_role('button',name=re.compile('Collect a light')).click()
        expect(page.get_by_role('heading',name='Choose a letter to uncover the word.')).to_be_visible();answer(page,'Reveal a letter');answer(page,'Pause');page.wait_for_timeout(600);state=page.evaluate(f"JSON.parse(sessionStorage.getItem('vector-shift:v2:question-{width}'))");letters=state['en'];page.reload();answer(page,'Resume');page.wait_for_timeout(600);assert page.evaluate(f"JSON.parse(sessionStorage.getItem('vector-shift:v2:question-{width}')).en")==letters
        answer(page,'Skip step');page.get_by_role('button',name=re.compile("I've looked")).click();expect(page.get_by_role('heading',name='What did you notice while looking at the screen?')).to_be_visible();answer(page,'Nothing stood out');expect(page.get_by_role('heading',name='How demanding did the activities feel?')).to_be_visible();answer(page,'Back');expect(page.get_by_role('button',name='Nothing stood out')).to_have_attribute('aria-label','Nothing stood out');assert page.get_by_role('button',name='Nothing stood out').evaluate("el=>getComputedStyle(el).borderColor")=='rgb(0, 184, 106)';snap(page,f'vector-one-question-after-{width}')
        answer(page,'Nothing stood out');expect(page.get_by_role('heading',name='How demanding did the activities feel?')).to_be_visible();answer(page,'Too demanding');expect(page.get_by_role('heading',name='Would looking around your room feel useful?')).to_be_visible();page.reload();answer(page,'Resume');expect(page.get_by_role('heading',name='Would looking around your room feel useful?')).to_be_visible();answer(page,'Skip step');expect(page.get_by_role('heading',name='Did this practice help?')).to_be_visible();assert page.get_by_text('You can choose support',exact=True).count()==0;snap(page,f'vector-ending-after-{width}');answer(page,'No change');answer(page,'Back');expect(page.get_by_role('heading',name='Would looking around your room feel useful?')).to_be_visible();answer(page,'Skip step');expect(page.get_by_role('button',name='No change')).to_have_attribute('aria-pressed','true');answer(page,'Continue to check-in')
        note(f'Vector {width}: original easy games, letters retained across reload, sequential actual questions, recoverable Back with actual answer retained, interruption paused, one optional ending question')
        context.close()
    browser.close()
assert not ERRORS,ERRORS
OUT.joinpath('browser-results.json').write_text(json.dumps({'results':RESULTS,'errors':ERRORS},indent=2)+'\n')
print('PASS all standalone one-question checks',flush=True)
