"""Local Home QA. Synthetic fixtures exercise rendering, never provider APIs."""
import json, os
from urllib.parse import urlparse
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
OUT=Path(os.environ.get('EVIDENCE_DIR','/tmp/wellness-evidence')); OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('BASE_URL','http://127.0.0.1:5173')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 reports=[]
 for width in [320,390,768,1280]:
  context=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce')
  context.add_init_script("try{localStorage.setItem('haven_onboarded','1')}catch{}")
  provider_requests=[]; context.on('request',lambda request:provider_requests.append(request.url) if urlparse(request.url).hostname and any(domain in urlparse(request.url).hostname for domain in ['ouraring.com','whoop.com','fitbit.com','garmin.com','health.googleapis.com']) else None)
  page=context.new_page(); errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto(BASE+'/'); iframe=page.frame_locator('iframe'); expect(iframe.locator('#wellness-open')).to_be_visible(timeout=20000)
  expect(page.get_by_role('status',name='Loading Mentication',exact=True)).to_be_hidden()
  expect(page.locator('iframe')).to_have_attribute('aria-hidden','false')
  expect(iframe.locator('.seven-days')).to_have_count(0)
  badge=page.frames[1].locator('#palace-badge').bounding_box(); icon=page.frames[1].locator('#palace-badge-icon').bounding_box()
  panel=page.frames[1].locator('.week-panel').bounding_box(); begin=page.frames[1].locator('.begin-button').bounding_box()
  assert abs(panel['x']+panel['width']/2-icon['x']-icon['width']/2)<1,'house is not at full-card centre'
  assert icon['y']>=begin['y']+begin['height'],'house must sit below Begin'
  assert abs(icon['width']-icon['height'])<1,'level artwork aspect ratio changed'
  expect(iframe.locator('#home-source')).to_have_count(0); expect(iframe.locator('.week-track')).to_be_visible()
  expect(iframe.locator('#week-heading')).to_have_text('Your week')
  expect(iframe.locator('#wellness-status')).to_have_text('Setup required')
  page.screenshot(path=str(OUT/f'home-{width}.png'))
  card=page.frames[1].locator('.week-panel').bounding_box()
  # The requested full-width house row takes natural height; never clip it to the old column layout.
  assert page.frames[1].locator('.wellness-region').bounding_box()['y']<page.frames[1].locator('.week-track').bounding_box()['y']
  iframe.locator('#wellness-open').focus(); page.keyboard.press('Enter'); expect(iframe.locator('#wellness-dialog')).to_be_visible()
  page.keyboard.press('Escape'); expect(iframe.locator('#wellness-dialog')).to_be_hidden()
  expect(iframe.locator('#wellness-open')).to_be_focused()
  page.keyboard.press('Enter'); expect(iframe.locator('#wellness-dialog')).to_be_visible()
  expect(iframe.locator('#wellness-sources .wellness-source')).to_have_count(1)
  expect(iframe.locator('#wellness-sources button')).to_have_count(0)
  expect(iframe.locator('#wellness-sources')).to_contain_text('Setup required')
  page.screenshot(path=str(OUT/f'setup-{width}.png'))
  iframe.get_by_role('button',name='Close wellness apps').click()
  expect(iframe.locator('#wellness-open')).to_be_focused()
  frame=page.frames[1]
  # Forged host message cannot replace any Home summary.
  page.evaluate("document.querySelector('iframe').contentWindow.postMessage({namespace:'mentication-host',version:1,type:'wellness',bridgeId:'wrong-token',wellness:{sources:[]}},'*')")
  expect(iframe.locator('#wellness-sources .wellness-source')).to_have_count(1)
  # Render-only fixtures use the standalone document, avoiding host hydration
  # deliberately replacing a fixture with its authoritative setup-only model.
  fixture=context.new_page(); fixture.goto(BASE+'/home.html'); fixture.wait_for_function('!!window.MenticationHome')
  iframe=fixture; frame=fixture
  source={'id':'oura','name':'Oura','detail':'Synthetic QA fixture','consent':'Read daily summaries','status':'connected','connected':True,'snapshot':{'syncedAt':'2020-01-01T10:00:00Z','metrics':[{'id':'sleep','label':'Sleep','unit':'score','value':0,'day':'2020-01-01'},{'id':'readiness','label':'Readiness','unit':'score','value':None,'day':'2020-01-01'},{'id':'activity','label':'Activity','unit':'score','value':91,'day':'2020-01-01'}]}}
  frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  frame.evaluate('MenticationHome.setWeek({currentDay:2,completedDays:[0,1]})')
  expect(iframe.locator('#wellness-summary')).to_be_visible(); expect(iframe.locator('.week-track')).to_be_visible()
  expect(iframe.locator('.week-day.is-complete')).to_have_count(2)
  expect(iframe.locator('.week-day.is-current')).to_have_attribute('data-day','2')
  for level in [0,3,6]:
   frame.evaluate('(level)=>MenticationHome.setPalace({level,name:"QA stage",nextName:level<6?"Next stage":"",stonesToNext:4,progress:.5})',level)
   expect(frame.locator('#palace-badge-level')).to_have_text(f'Level {level+1} of 7')
   expect(frame.locator('#palace-badge-icon')).to_have_attribute('aria-label',f'Your Peace Palace, level {level+1} of 7')
   badge=frame.locator('#palace-badge').bounding_box(); icon=frame.locator('#palace-badge-icon').bounding_box()
   panel=frame.locator('.week-panel').bounding_box()
   assert abs(panel['x']+panel['width']/2-icon['x']-icon['width']/2)<1,'progression house moved off full-card centre'
   expect(frame.locator('#palace-badge-art svg')).to_have_count(1)
  frame.evaluate('MenticationHome.setPalace({level:0,name:"The quiet clearing",nextName:"The shack",stonesToNext:4,progress:0})')
  metrics=iframe.locator('.wellness-metrics').bounding_box(); track=iframe.locator('.week-track').bounding_box()
  assert metrics['y']+metrics['height']<=track['y']
  assert frame.locator('#wellness-open').bounding_box()['height']>=44
  for selector in ['.begin-button','.palace-badge-icon']:
   assert frame.locator(selector).bounding_box()['height']>=44,selector
  expect(iframe.locator('#wellness-summary')).to_contain_text('0 /100'); expect(iframe.locator('#wellness-summary')).to_contain_text('Not shared')
  expect(iframe.locator('#wellness-summary')).to_contain_text('Update needed'); expect(iframe.locator('#wellness-summary')).to_contain_text('2020-01-01')
  fixture.screenshot(path=str(OUT/f'scores-{width}.png'))
  controls=['#wellness-open','.begin-button','.palace-badge-icon']
  boxes=[frame.locator(selector).bounding_box() for selector in controls]
  for i,left in enumerate(boxes):
   for right in boxes[i+1:]:
    overlap_x=min(left['x']+left['width'],right['x']+right['width'])-max(left['x'],right['x'])
    overlap_y=min(left['y']+left['height'],right['y']+right['height'])-max(left['y'],right['y'])
    assert overlap_x<=0 or overlap_y<=0,'overlapping card controls'
  frame.evaluate("document.documentElement.dataset.largeText='true';document.documentElement.dataset.highContrast='true'")
  assert frame.evaluate('document.documentElement.scrollWidth <= innerWidth'),'large-text overflow'
  expect(frame.locator('.week-track')).to_be_visible()
  frame.evaluate("document.documentElement.dataset.largeText='false';document.documentElement.dataset.highContrast='false'")
  source['status']='loading'; frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  expect(iframe.get_by_role('button',name='Sync now')).to_be_disabled(); expect(iframe.locator('#wellness-status')).to_contain_text('Syncing')
  source['status']='error'; source['error']='Could not update this connection. Please try again.'
  frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source); expect(iframe.locator('#wellness-summary')).to_contain_text('Please try again')
  source['snapshot']=None; frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  expect(iframe.locator('#wellness-summary')).to_contain_text('No summaries shared yet')
  # Browser consent and action messages remain token-bound; use QA-only public harness.
  source['status']='disconnected'; source['connected']=False; source.pop('error')
  frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  expect(iframe.locator('#wellness-summary')).to_be_hidden(); expect(iframe.locator('.week-track')).to_be_visible()
  expect(iframe.locator('.week-day.is-complete')).to_have_count(2)
  iframe.locator('#wellness-open').click(); connect=iframe.get_by_role('button',name='Connect Oura',exact=True)
  expect(connect).to_be_disabled(); iframe.locator('.wellness-consent input').check(); expect(connect).to_be_enabled()
  iframe.get_by_role('button',name='Close wellness apps').click()
  expect(iframe.locator('[data-route="begin"]')).to_be_visible()
  assert frame.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'overflow {width}'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'host overflow {width}'
  assert not errors,errors
  assert not provider_requests,provider_requests
  print('PASS width',width,flush=True)
  reports.append({'width':width,'checks':'stacked setup, full-card centred house, single title, Oura above persistent weekdays, 44px targets, consent, scores, missing, stale, loading, error, disconnect retains progress, forged token, no overflow','pageErrors':errors,'providerRequests':len(provider_requests),'setupHeightPx':card['height']})
  context.close()
 (OUT/'report.json').write_text(json.dumps(reports,indent=2)); print(json.dumps(reports,indent=2)); browser.close()
