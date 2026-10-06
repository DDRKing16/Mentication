"""Built app integration: npm run preview -- --port 4176, then run this file."""
from playwright.sync_api import sync_playwright, expect
KEY='mentation.signal-lock.grounding.v1'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script('try{localStorage.setItem("haven_onboarded","1");localStorage.setItem("haven.a11y.v2",JSON.stringify({reducedMotion:true}))}catch{}')
    page.goto('http://localhost:4176/signal-lock')
    frame=page.frame_locator('iframe[title="Signal Lock"]')
    frame.get_by_role('button',name='Follow the signal').click()
    frame.get_by_role('button',name='First signal',exact=True).click()
    page.get_by_role('button',name='Home',exact=True).click()
    expect(page).to_have_url('http://localhost:4176/')
    saved=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)['current']
    assert saved['status']=='paused' and saved['halfPair']
    page.goto('http://localhost:4176/signal-lock')
    frame=page.frame_locator('iframe[title="Signal Lock"]')
    frame.get_by_role('button',name='Continue the signal').click()
    frame.get_by_role('button',name='Second signal',exact=True).click()
    frame.get_by_role('button',name='Stop here').click()
    expect(frame.locator('#summary-detail')).to_contain_text('1 connection made')
    page.goto('http://localhost:4176/library')
    page.get_by_placeholder('Search practices…').fill('Signal Lock')
    expect(page.get_by_text('Follow a gentle visual signal and reveal a softly lit room, one small connection at a time.',exact=True)).to_be_visible()
    page.screenshot(path='/tmp/signal-lock-evidence/library-grounding.png',full_page=True)
    assert not errors,errors
    print('PASS built /signal-lock iframe, host Home exit saves partial progress, route return resumes, library identity; no page errors')
    browser.close()
