"""Historical source-only report reproduced in Chromium with synthetic state.
Serve public/ on localhost:4174, then run this from the repository root.
Keyboard activation is intentional: the old mobile overlay intercepts pointer clicks.
"""
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
source = subprocess.check_output(['git','show','e2369be13e67553b220d9630a5d0f522716f3b97:public/signal-lock/index.html'],text=True)
source = source.replace('[n,t]=D.useState("bedroom")','[n,t]=D.useState("timer")').replace('[X,V]=D.useState(null)','[X,V]=D.useState("Synthetic report task")').replace('[ke,jn]=D.useState(["","","","",""])','[ke,jn]=D.useState(["Synthetic planned step A","Synthetic planned step B"])')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    page.route('**/signal-lock/index.html',lambda route:route.fulfill(body=source,content_type='text/html'))
    page.goto('http://localhost:4174/signal-lock/index.html')
    page.get_by_role('button',name='Skip ahead → Completed',exact=True).press('Enter')
    expect(page.get_by_role('heading',name='Lock complete')).to_be_visible()
    expect(page.get_by_text('COMPLETED ITEMS • LEFT → RIGHT')).to_be_visible()
    expect(page.get_by_text('8 min locked',exact=False)).to_be_visible()
    Path('/tmp/signal-lock-baseline.txt').write_text(page.locator('body').inner_text())
    page.screenshot(path='/tmp/signal-lock-before.png')
    print('Reproduced: no Start, no task confirmations, yet Lock complete / planned items completed / 8 min locked.')
    browser.close()
