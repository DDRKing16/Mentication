"""Integrated host/iframe pause and deletion checks."""
import os
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,reduced_motion='reduce')
    page=context.new_page(); errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    origin=os.environ.get('JOURNEY_URL', 'http://127.0.0.1:5177')
    page.goto(origin+'/start');page.evaluate("localStorage.setItem('haven_onboarded','1')")
    for route,name,title in [('/night-channel','Night Channel','Night Channel'),('/good-map','The Good Map','The Good Map'),('/dear-2100','Dear 2100','Dear 2100')]:
        page.goto(origin+route)
        frame=page.frame_locator('iframe[title="'+title+'"]')
        expect(frame.locator('body')).not_to_be_empty(timeout=15000)
        if route == '/good-map':
            expect(frame.locator('#gmStart')).to_be_visible(timeout=15000)
        # Marker proves opening/closing the alternative does not remount the iframe.
        page.locator('iframe').evaluate("f => f.contentWindow.syntheticProgress = 'preserve'")
        page.get_by_role('button',name='Another way',exact=True).click(timeout=15000)
        dialog=page.get_by_role('dialog',name='Another way · '+name)
        expect(dialog).to_be_visible()
        dialog.get_by_role('button',name='Return to '+name,exact=True).click()
        assert page.locator('iframe').evaluate("f => f.contentWindow.syntheticProgress")=='preserve'
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    # Vector Shift goes through its existing baseline, then its original build.
    page.goto(origin+'/vector-shift')
    page.get_by_role('slider').fill('4')
    page.get_by_role('button',name='Start Vector Shift',exact=True).click()
    expect(page.frame_locator('iframe').get_by_role('button',name='Tap here to begin',exact=True)).to_be_visible(timeout=15000)
    page.get_by_role('button',name='Another way',exact=True).click()
    expect(page.get_by_role('dialog',name='Another way · Vector Shift')).to_be_visible()
    page.get_by_role('button',name='Return to Vector Shift',exact=True).click()
    assert page.locator('iframe').evaluate("f => f.contentDocument.documentElement.classList.contains('vs-paused')")
    # Integrated adapters acknowledge pause without remounting valid progress.
    for route,name in [('/signal-lock','Signal Lock'),('/foundations','Foundations')]:
        page.goto(origin+route)
        expect(page.frame_locator('iframe').locator('body')).not_to_be_empty(timeout=15000)
        page.locator('iframe').evaluate("f => f.contentWindow.syntheticProgress = 'preserve'")
        page.get_by_role('button',name='Another way',exact=True).click(timeout=15000)
        expect(page.get_by_role('dialog',name='Another way · '+name)).to_be_visible()
        page.get_by_role('button',name='Return to '+name,exact=True).click()
        assert page.locator('iframe').evaluate("f => f.contentWindow.syntheticProgress") == 'preserve'
    # Cross-tab deletion disposes old state before its pagehide save can resurrect it.
    page.goto(origin+'/signal-lock')
    signal=page.locator('iframe')
    expect(page.frame_locator('iframe').locator('body')).not_to_be_empty(timeout=15000)
    signal.evaluate("f => { f.contentWindow.syntheticProgress='old'; f.contentWindow.addEventListener('pagehide',()=>f.contentWindow.localStorage.setItem('mentation.signal-lock.grounding.v1',JSON.stringify({version:1,current:{status:'paused'}}))); }")
    other=context.new_page();other.goto(origin+'/start')
    other.evaluate("localStorage.setItem('mentation.signal-lock.grounding.v1',JSON.stringify({version:1,current:{status:'paused'}}))")
    other.evaluate("localStorage.removeItem('mentation.signal-lock.grounding.v1')")
    page.wait_for_function("document.querySelector('iframe').contentWindow.syntheticProgress !== 'old' && document.querySelector('iframe').getAttribute('src') === '/signal-lock/index.html'")
    assert page.evaluate("localStorage.getItem('mentation.signal-lock.grounding.v1')") is None
    other.close()
    assert not errors,errors
    print('PASS: Night Channel/Good Map/Dear 2100 preserve iframe state; Vector Shift pauses; Foundations/SignalLock acknowledge secure pause; cross-tab deletion does not resurrect old state; no page errors.')
    browser.close()
