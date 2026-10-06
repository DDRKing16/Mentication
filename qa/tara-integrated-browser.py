"""Real-host Tara: exact reported outcomes, optional recap, privacy and deletion."""
import os
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('JOURNEY_URL','http://127.0.0.1:5184')
KEY='mentation.tara-tactician.v1'
comparisons=[('It happened','happened','finished'),('Part of it happened','partly','finished'),('It did not happen','did-not','stepped-out'),('I did not test it','not-tested','not-attempted'),('I’m not sure yet','unsure','unknown')]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium');errors=[]
 for i,(label,enum,action) in enumerate(comparisons):
  context=b.new_context(viewport={'width':320 if i%2 else 390,'height':844},is_mobile=True,reduced_motion='reduce')
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/start');page.evaluate("localStorage.setItem('haven_onboarded','1')")
  def click(name):page.get_by_role('button',name=name,exact=True).click()
  click('I want a plan for something difficult');expect(page.get_by_role('heading',name='You could try Tara Tactician',exact=True)).to_be_visible();click('Explore this practice')
  click('Prepare for something');click('A conversation');click('Finding the words')
  click('Edit prediction');page.get_by_role('textbox',name='My prediction',exact=True).fill('Synthetic private prediction');click('Keep this wording')
  click('Edit my move');page.get_by_role('textbox',name='My next move',exact=True).fill('Synthetic private action');click('Keep this wording')
  click('Another way');expect(page.get_by_role('dialog',name='Another way · Tara Tactician')).to_be_visible();click('Return to Tara Tactician')
  page.reload();expect(page.get_by_text('Synthetic private action',exact=True)).to_be_visible()
  click('Use this move');click('Find my words');page.reload();click('Back to event');click('Event finished')
  page.get_by_label('What did I do?',exact=True).select_option(action)
  click(label);click('Keep this reflection')
  page.locator('summary').filter(has_text='What I want to carry forward').click()
  click('Add or edit my learning');page.get_by_role('textbox',name='What I want to keep or change',exact=True).fill('Synthetic learning '+enum);click('Keep this wording')
  click('Add or edit my next step');page.get_by_role('textbox',name='My next small step',exact=True).fill('Synthetic chosen next step');click('Keep this wording')
  if i==0:
   click('Save recap on this device (optional)');page.reload();page.locator('summary').filter(has_text='What I want to carry forward').click();expect(page.get_by_text('Synthetic learning '+enum,exact=True)).to_be_visible()
  click('Finish');page.wait_for_url(BASE+'/',timeout=15000)
  result=page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1'))[0]")
  assert result['intervention_outcome']['eventStatus']==action and result['intervention_outcome']['predictionResult']==enum,result
  assert result['intervention_outcome']['rehearsed'] is False
  assert 'Synthetic private' not in str(result) and 'Synthetic learning' not in str(result)
  assert result['intensity_start'] is None and result['intensity_end'] is None
  assert 'Synthetic private' not in str(page.evaluate('history.state'))
  if i==0:
   page.goto(BASE+'/return-points');expect(page.get_by_text('What you want to remember: Synthetic learning '+enum,exact=True)).to_be_visible()
   click('Delete Tara reflection');page.reload();expect(page.get_by_text('What you want to remember: Synthetic learning '+enum,exact=True)).to_have_count(0)
  page.goto(BASE+'/tara-tactician')
  if i!=0:click('Close recap');page.wait_for_url(BASE+'/',timeout=15000)
  assert page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1')).length")==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('PASS actual host outcome, resume, privacy, no duplicate completion:',action,enum)
  context.close()
 # Cross-tab global-key deletion must clear mounted words without resurrection.
 context=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');page=context.new_page()
 page.goto(BASE+'/start');page.evaluate("localStorage.setItem('haven_onboarded','1')");page.goto(BASE+'/tara-tactician')
 page.get_by_role('button',name='Prepare for something',exact=True).click();page.get_by_role('button',name='A conversation',exact=True).click();page.get_by_role('button',name='Finding the words',exact=True).click()
 page.get_by_role('button',name='Edit prediction',exact=True).click();page.get_by_role('textbox',name='My prediction',exact=True).fill('Synthetic delete me');page.get_by_role('button',name='Keep this wording',exact=True).click()
 other=context.new_page();other.goto(BASE+'/start');other.evaluate('(key)=>localStorage.removeItem(key)',KEY)
 expect(page.get_by_role('heading',name='One small step into something difficult.',exact=True)).to_be_visible()
 page.wait_for_timeout(100);assert page.evaluate('(key)=>localStorage.getItem(key)',KEY) is None
 assert not errors,errors
 print('PASS mounted Tara cross-tab deletion clears authored content and does not resurrect draft')
 b.close()
