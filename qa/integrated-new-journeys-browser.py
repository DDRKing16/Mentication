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
        click('Use my own words');page.get_by_role('textbox').fill('Synthetic private notice '+ident)
        click('Try a voice on my side' if ident=='selfCompassion' else 'Work with this thought' if ident=='unhook' else 'Find a steady point nearby')
        if ident=='selfCompassion':
            click('Write a response I can believe');page.get_by_role('textbox',name='A response I can believe').fill('Synthetic confirmed perspective '+ident);click('Use these words')
        else:
            if ident=='unhook':click('Notice this as a thought')
            click('Something I can see');click('Name what I notice' if ident=='unhook' else 'Name it');page.get_by_label('An object or colour nearby',exact=True).fill('Synthetic confirmed anchor '+ident)
            if ident=='makeRoom':click('A little')
        page.locator('details.pf-next > summary').click();page.get_by_label('Or my own step',exact=True).fill('Synthetic chosen next action '+ident)
        click('Another way');expect(page.get_by_role('dialog')).to_be_visible();click('Return to '+name)
        page.reload();click('Resume practice')
        page.get_by_role('button',name='I tried saying these words' if ident=='selfCompassion' else 'I tried noticing and returning attention' if ident=='unhook' else 'I tried making room for the feeling',exact=False).click()
        click('Skip rating');click('Save this card on my device')
        click('Finish');expect(page.get_by_text('Not answered yet.',exact=True)).to_be_visible()
        page.reload();expect(page.get_by_text('Not answered yet.',exact=True)).to_be_visible();click('Skip and finish')
        page.wait_for_url(URL+'/',timeout=15000)
        page.goto(URL+'/return-points');expect(page.get_by_text('Synthetic chosen next action '+ident,exact=False).first).to_be_visible()
        page.get_by_role('button',name='Delete saved card',exact=True).click();page.reload()
        expect(page.get_by_text('Synthetic chosen next action '+ident,exact=False).first).to_have_count(0)
        sessions=page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))")
        assert 'Synthetic private' not in str(sessions) and 'Synthetic confirmed' not in str(sessions)
        actual=sessions[0]['intervention_outcome'];assert actual['assessment']['before']==0 and actual['assessment']['after'] is None
        assert actual['change'] is None
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        print('PASS real host route, optional check-ins, alternative, refresh, save/return/delete, private-text exclusion:',ident)
    launch('Gentle Tapping');click('A worry');click('0 out of 10');click('Begin my round')
    page.wait_for_timeout(1200);click('Another way');expect(page.get_by_role('dialog')).to_be_visible();click('Return to Gentle Tapping')
    expect(page.get_by_role('button',name='Resume my round',exact=True)).to_be_visible();page.reload()
    expect(page.get_by_role('button',name='Resume my round',exact=True)).to_be_visible();click('Resume my round');click('Stop round');click('Skip this rating')
    page.get_by_role('region',name='Gentle Tapping',exact=True).locator('details.journey-takeaway > summary').click();page.get_by_role('region',name='Gentle Tapping',exact=True).get_by_role('textbox').fill('Synthetic tapping cue')
    click('Save on this device');click('Finish');click('Skip and finish');page.wait_for_url(URL+'/',timeout=15000)
    result=page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))[0]")
    assert result['intervention_outcome']['before']==0 and result['intervention_outcome']['after'] is None
    assert result['intervention_outcome']['roundsCompleted']==0 and result['completed_pathway']==[]
    assert page.evaluate("localStorage.getItem('mentation.eftTapping.draft.v1')") is None
    page.goto(URL+'/return-points');expect(page.get_by_text('Synthetic tapping cue',exact=True)).to_be_visible();click('Delete this note')
    assert not errors,errors
    print('PASS tapping real host: optional exact scale, alternative pause, refresh paused, stopped round gets no full credit, optional note save/delete')
    browser.close()
