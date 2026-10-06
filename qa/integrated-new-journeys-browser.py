"""Real mobile host routes, new saved cards, tapping pause/refresh/stop honesty."""
import os
from playwright.sync_api import sync_playwright, expect
URL=os.environ.get('JOURNEY_URL','http://127.0.0.1:5181')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium')
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,reduced_motion='reduce')
    page=context.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(URL+'/start');page.evaluate("localStorage.setItem('haven_onboarded','1')")
    def click(name): page.get_by_role('button',name=name,exact=True).click()
    def launch(name):
        page.goto(URL+'/library');page.get_by_placeholder('Search practices…').fill(name)
        page.get_by_role('button',name=name+' ',exact=False).click()
    for ident,name in [('selfCompassion','Self-Compassion'),('unhook','Unhook from the Thought'),('makeRoom','Make Room for the Feeling')]:
        launch(name);click('Begin');click('0 of 10');click('Continue')
        page.get_by_role('textbox').fill('Synthetic private notice');click('Continue')
        page.get_by_role('textbox').fill('Synthetic confirmed perspective '+ident)
        click('Try a little room' if ident=='makeRoom' else 'Try this response')
        click('Another way');expect(page.get_by_role('dialog')).to_be_visible();click('Return to '+name)
        page.reload();click('Resume practice')
        click('Stop practice and look around' if ident=='makeRoom' else 'Choose my next step')
        if ident=='makeRoom':click('Choose a next step')
        page.get_by_role('textbox').fill('Synthetic chosen next action')
        click('Keep it as my next step');click('Skip rating');click('Save my card on this device')
        click('Finish');expect(page.get_by_text('Not answered yet.',exact=True)).to_be_visible()
        page.reload();expect(page.get_by_text('Not answered yet.',exact=True)).to_be_visible();click('Skip and finish')
        page.wait_for_url(URL+'/',timeout=15000)
        page.goto(URL+'/return-points');expect(page.get_by_text('Synthetic confirmed perspective '+ident,exact=True)).to_be_visible()
        page.get_by_role('button',name='Delete saved card',exact=True).click();page.reload()
        expect(page.get_by_text('Synthetic confirmed perspective '+ident,exact=True)).to_have_count(0)
        sessions=page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))")
        assert 'Synthetic private' not in str(sessions) and 'Synthetic confirmed' not in str(sessions)
        actual=sessions[0]['intervention_outcome'];assert actual['assessment']['before']==0 and actual['assessment']['after'] is None
        assert actual['change'] is None
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        print('PASS real host route, optional check-ins, alternative, refresh, save/return/delete, private-text exclusion:',ident)
    launch('Gentle Tapping');click('A worry');click('0 out of 10');click('Begin my round')
    page.wait_for_timeout(1200);click('Another way');expect(page.get_by_role('dialog')).to_be_visible();click('Return to Gentle Tapping')
    expect(page.get_by_role('button',name='Resume',exact=True)).to_be_visible();page.reload()
    expect(page.get_by_role('button',name='Resume',exact=True)).to_be_visible();click('Resume');click('Stop round');click('Skip this rating')
    page.get_by_role('region',name='Gentle Tapping',exact=True).locator('summary').click();page.get_by_role('region',name='Gentle Tapping',exact=True).get_by_role('textbox').fill('Synthetic tapping cue')
    click('Save on this device');click('Finish');click('Skip and finish');page.wait_for_url(URL+'/',timeout=15000)
    result=page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))[0]")
    assert result['intervention_outcome']['before']==0 and result['intervention_outcome']['after'] is None
    assert result['intervention_outcome']['roundsCompleted']==0 and result['completed_pathway']==[]
    assert page.evaluate("localStorage.getItem('mentation.eftTapping.draft.v1')") is None
    page.goto(URL+'/return-points');expect(page.get_by_text('Synthetic tapping cue',exact=True)).to_be_visible();click('Delete this note')
    assert not errors,errors
    print('PASS tapping real host: optional exact scale, alternative pause, refresh paused, stopped round gets no full credit, optional note save/delete')
    browser.close()
