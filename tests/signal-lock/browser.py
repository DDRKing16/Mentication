"""Real Chromium regression checks; uses an existing Python Playwright install.
Run: python tests/signal-lock/browser.py http://localhost:4175
No production test hooks or dependencies are installed.
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4175'
KEY = 'mentation.signal-lock.grounding.v1'
OUT = Path('/tmp/signal-lock-evidence'); OUT.mkdir(exist_ok=True)
def record(page): return page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
def pair(page):
    page.get_by_role('button', name='First signal', exact=True).click()
    page.get_by_role('button', name='Second signal', exact=True).click()
def new_page(browser, width=390, height=844, **kwargs):
    context = browser.new_context(viewport={'width':width,'height':height}, **kwargs)
    page = context.new_page(); page.set_default_timeout(5000)
    page.clock.install()
    page.goto(BASE+'/signal-lock/index.html')
    return page
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    errors=[]
    page=new_page(browser)
    page.on('pageerror', lambda error: errors.append(str(error)))
    expect(page.locator('#elapsed')).to_be_hidden()
    page.get_by_role('button',name='Not now',exact=True).click()
    assert record(page)['current']['status']=='skipped'
    assert record(page)['current']['elapsedMs']==0
    expect(page.locator('#summary-title')).to_have_text('Session skipped')
    page.get_by_role('button',name='Begin another scene').click()
    page.get_by_role('button',name='Follow the signal').click()
    page.clock.run_for(2100)
    page.get_by_role('button',name='First signal',exact=True).click()
    expect(page.get_by_role('button',name='First signal connected')).to_be_disabled()
    assert record(page)['current']['pairs']==0
    page.get_by_role('button',name='Pause',exact=True).click()
    before=record(page)['current']['elapsedMs']
    page.clock.run_for(60000)
    assert record(page)['current']['elapsedMs']==before
    page.reload()
    expect(page.get_by_role('button',name='Continue the signal')).to_be_visible()
    assert record(page)['current']['halfPair']
    assert record(page)['current']['elapsedMs']==before
    page.get_by_role('button',name='Continue the signal').click()
    page.clock.run_for(1500)
    page.get_by_role('button',name='Second signal',exact=True).click()
    assert record(page)['current']['pairs']==1
    expect(page.locator('#lines path')).to_have_count(1)
    expect(page.locator('#reveals span')).to_have_count(1)
    page.evaluate('window.dispatchEvent(new Event("blur"))')
    assert record(page)['current']['status']=='paused'
    after=record(page)['current']['elapsedMs']
    assert 1500 <= after-before < 2000
    page.clock.run_for(10000)
    page.get_by_role('button',name='Continue the signal').click()
    for _ in range(5): pair(page)
    expect(page.get_by_role('button',name='Finish this scene')).to_be_visible()
    assert record(page)['current']['status']=='active'
    assert record(page)['current']['pairs']==6
    page.get_by_role('button',name='Finish this scene').click()
    assert record(page)['current']['status']=='completed'
    assert len(record(page)['history'])==2
    elapsed=record(page)['current']['elapsedMs']
    page.clock.run_for(100000)
    assert record(page)['current']['elapsedMs']==elapsed
    assert record(page)['current']['feeling'] is None
    page.get_by_role('button',name='About the same',exact=True).click()
    page.reload()
    assert record(page)['current']['feeling']=='About the same'
    assert len(record(page)['history'])==2
    page.get_by_role('button',name='Begin another scene').click()
    assert record(page)['current']['pairs']==0
    assert record(page)['current']['feeling'] is None
    assert len(record(page)['history'])==2
    page.get_by_role('button',name='Follow the signal').click()
    page.get_by_role('button',name='First signal',exact=True).click()
    page.get_by_role('button',name='Stop here').click()
    expect(page.locator('#unfinished')).to_contain_text('unfinished')
    assert record(page)['current']['status']=='ended'
    assert not errors, errors
    print('PASS skip, start, exact two taps, pause/resume, refresh, interruption, full scene, partial end, check-in, history, repeat')

    for width,height in [(320,568),(360,640),(375,667),(390,844),(430,932),(844,390),(768,1024),(1280,800)]:
        page=new_page(browser,width,height,is_mobile=width<500,has_touch=True)
        page.get_by_role('button',name='Follow the signal').click()
        for _ in range(7): pair(page)
        assert record(page)['current']['pairs']==7
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        for id in ['target-one','target-two']:
            box=page.locator('#'+id).bounding_box(); assert box['width']>=44 and box['height']>=44
        page.get_by_role('button',name='Show elapsed time').click()
        expect(page.locator('#elapsed')).to_be_visible()
        page.get_by_role('button',name='Hide elapsed time').click()
        expect(page.locator('#elapsed')).to_be_hidden()
        page.clock.run_for(1700)
        page.screenshot(path=str(OUT/f'play-{width}x{height}.png'),full_page=True)
        page.get_by_role('button',name='Stop here').click()
        page.get_by_role('button',name='More difficult',exact=True).click()
        page.screenshot(path=str(OUT/f'end-{width}x{height}.png'),full_page=True)
        print(f'PASS mobile/layout/continue/controls {width}x{height}')
        page.context.close()

    page=new_page(browser,reduced_motion='reduce')
    page.get_by_role('button',name='Follow the signal').press('Enter')
    expect(page.locator('#target-one')).to_be_focused()
    page.keyboard.press('Enter'); expect(page.locator('#target-two')).to_be_focused()
    page.keyboard.press('Enter'); expect(page.locator('#target-one')).to_be_focused()
    assert page.locator('#target-one span').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
    assert page.locator('#lines path').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
    assert record(page)['current']['pairs']==1
    print('PASS keyboard focus, OS reduced motion, equivalent reveal')
    page=new_page(browser)
    page.evaluate('localStorage.setItem("haven.a11y.v2",JSON.stringify({reducedMotion:true,largeText:true,highContrast:true}));localStorage.setItem("existing-progress","keep")')
    page.reload(); assert page.locator('html').get_attribute('class')=='still large-text high-contrast'
    page.get_by_role('button',name='Follow the signal').click();pair(page)
    assert page.evaluate('localStorage.getItem("existing-progress")')=='keep'
    page.screenshot(path=str(OUT/'large-text-still.png'),full_page=True)
    print('PASS saved accessibility preferences and existing data preservation')
    page=new_page(browser)
    page.get_by_role('button',name='Follow the signal').click();page.clock.run_for(1000)
    page.evaluate('window.dispatchEvent(new Event("pagehide"))')
    assert record(page)['current']['status']=='paused'
    print('PASS pagehide save and pause')
    page.get_by_role('button',name='Continue the signal').click();pair(page)
    page.clock.run_for(1500)
    before=record(page)['current']['elapsedMs']
    page.reload()
    assert record(page)['current']['status']=='paused'
    assert record(page)['current']['pairs']==1
    # pagehide can record the last fraction since the 500 ms checkpoint.
    restored=record(page)['current']['elapsedMs']
    assert before <= restored < before+750, (before,restored)
    page.clock.run_for(30000)
    assert record(page)['current']['elapsedMs']==restored
    print('PASS refresh while active restores paused without downtime credit')
    page=new_page(browser)
    page.get_by_role('button',name='Still scene',exact=True).click()
    page.reload()
    expect(page.get_by_role('button',name='Still scene on')).to_have_attribute('aria-pressed','true')
    page.get_by_role('button',name='Follow the signal').click();pair(page)
    assert page.locator('#lines path').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
    print('PASS manual still-scene preference survives refresh')
    context=browser.new_context()
    page=context.new_page()
    page.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new Error("storage blocked")}})')
    page.goto(BASE+'/signal-lock/index.html')
    page.get_by_role('button',name='Follow the signal').click();pair(page)
    expect(page.locator('#save-status')).to_contain_text('open session only')
    page.get_by_role('button',name='Stop here').click()
    expect(page.locator('#summary-detail')).to_contain_text('1 connection')
    print('PASS denied storage with honest fallback')
    browser.close()
print('ALL BROWSER CHECKS PASSED. Evidence:',OUT)
