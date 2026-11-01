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
  expect(iframe.locator('#home-source')).to_have_value('week'); expect(iframe.locator('.week-track')).to_be_visible()
  iframe.locator('#wellness-open').click(); expect(iframe.locator('#wellness-dialog')).to_be_visible()
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
  iframe.locator('#home-source').select_option('oura')
  expect(iframe.locator('#wellness-summary')).to_be_visible(); expect(iframe.locator('.week-track')).to_be_hidden()
  expect(iframe.locator('#wellness-summary')).to_contain_text('0 /100'); expect(iframe.locator('#wellness-summary')).to_contain_text('Not shared')
  expect(iframe.locator('#wellness-summary')).to_contain_text('Update needed'); expect(iframe.locator('#wellness-summary')).to_contain_text('2020-01-01')
  fixture.screenshot(path=str(OUT/f'scores-{width}.png'))
  source['status']='loading'; frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  expect(iframe.get_by_role('button',name='Sync now')).to_be_disabled(); expect(iframe.locator('#wellness-summary')).to_contain_text('Syncing')
  source['status']='error'; source['error']='Could not update this connection. Please try again.'
  frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source); expect(iframe.locator('#wellness-summary')).to_contain_text('Please try again')
  source['snapshot']=None; frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  expect(iframe.locator('#wellness-summary')).to_contain_text('No summaries shared yet')
  # Browser consent and action messages remain token-bound; use QA-only public harness.
  source['status']='disconnected'; source['connected']=False; source.pop('error')
  frame.evaluate('(source)=>MenticationHome.setWellness({sources:[source]})',source)
  expect(iframe.locator('#home-source')).to_have_value('week'); expect(iframe.locator('.week-track')).to_be_visible()
  iframe.locator('#wellness-open').click(); connect=iframe.get_by_role('button',name='Connect Oura',exact=True)
  expect(connect).to_be_disabled(); iframe.locator('.wellness-consent input').check(); expect(connect).to_be_enabled()
  iframe.get_by_role('button',name='Close wellness apps').click()
  iframe.locator('#home-source').select_option('week'); expect(iframe.locator('[data-route="begin"]')).to_be_visible()
  assert frame.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'overflow {width}'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'host overflow {width}'
  assert not errors,errors
  assert not provider_requests,provider_requests
  print('PASS width',width,flush=True)
  reports.append({'width':width,'checks':'setup gate, defaults, consent, scores, missing, stale, loading, error, disconnect fallback, forged token, no overflow','pageErrors':errors,'providerRequests':len(provider_requests)})
  context.close()
 (OUT/'report.json').write_text(json.dumps(reports,indent=2)); print(json.dumps(reports,indent=2)); browser.close()
