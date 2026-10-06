"""Verified shared finish through original journeys; synthetic notes/check-ins only."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://127.0.0.1:5191')
parser.add_argument('--out',default='/tmp/completion-save-review')
args=parser.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium')
    errors=[]
    def create(width=390):
        context=browser.new_context(viewport={'width':width,'height':844 if width==390 else 640},reduced_motion='reduce')
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(args.url+'/start');page.evaluate("localStorage.setItem('haven_onboarded','1')")
        return context,page
    def launch(page,name):
        page.goto(args.url+'/library');page.get_by_placeholder('Search practices…').fill(name)
        page.get_by_role('button',name=name).click()
    def scene_review(page):
        launch(page,'Change the Scene')
        expect(page.get_by_role('button',name='Start Change the Scene',exact=True)).to_be_visible()
        page.get_by_role('slider').fill('4')
        page.get_by_role('combobox',name='Current distress',exact=True).select_option('4')
        page.get_by_role('button',name='Start Change the Scene',exact=True).click()
        page.get_by_role('button',name='Begin Change the Scene',exact=False).click()
        page.get_by_role('button',name='I moved',exact=True).click()
        page.get_by_role('button',name='Continue',exact=True).click()
        for _ in range(5):page.get_by_role('button',name='Skip this action',exact=True).click()
        expect(page.get_by_text('You confirmed 1 of 6 actions and skipped 5. Choosing an action alone does not count as doing it.',exact=True)).to_be_visible()
        page.get_by_role('button',name='No difference',exact=True).click()
        page.get_by_role('button',name='Continue to final rating',exact=True).click()
        expect(page.get_by_role('button',name='Skip and finish',exact=True)).to_be_visible()
    def block_writes(page,mode='throw'):
        page.evaluate("""mode => {
          window.previousHistoryWrite=Storage.prototype.setItem;
          window.failedHistoryWrites=[];
          Storage.prototype.setItem=function(k,v){
            if(k==='mentation.sessions.v1'){
              window.failedHistoryWrites.push(JSON.parse(v)[0]);
              if(mode==='throw')throw new DOMException('Synthetic quota','QuotaExceededError');
              return;
            }
            window.previousHistoryWrite.call(this,k,v);
          };
        }""",mode)
    def restore_writes(page):
        page.evaluate('() => { Storage.prototype.setItem=window.previousHistoryWrite; }')
    def error_screen(page):
        expect(page.get_by_role('heading',name='Your practice has ended.',exact=True)).to_be_visible()
        expect(page.get_by_role('alert')).to_contain_text('We could not confirm')
        assert '/reset' in page.url
        assert page.evaluate('document.activeElement.tagName')=='H1'
    def records(page):return page.evaluate("JSON.parse(localStorage.getItem('mentation.sessions.v1')||'[]')")

    context,page=create(390);scene_review(page)
    page.locator('main').get_by_text('Keep something for later · optional',exact=True).click()
    page.get_by_role('textbox').fill('Synthetic Scene note: an indoor position change.')
    page.get_by_role('button',name='Save on this device',exact=True).click()
    expect(page.get_by_role('status')).to_have_text('Saved on this device.')
    page.get_by_role('slider').fill('6');block_writes(page)
    page.get_by_role('button',name='Confirm rating: 6',exact=True).click();error_screen(page)
    snapshot=page.evaluate('history.state.usr.reset_completion')
    assert snapshot['goalRating']==6 and snapshot['completedAt']>0
    assert records(page)==[]
    first=page.evaluate('window.failedHistoryWrites[0]')
    page.screenshot(path=str(out/'scene-save-recovery-390.png'),full_page=True)
    page.wait_for_timeout(1200)
    page.get_by_role('button',name='Retry saving history',exact=True).click()
    expect(page.get_by_role('button',name='Retry saving history',exact=True)).to_be_enabled()
    retry=page.evaluate('window.failedHistoryWrites[1]')
    for key in ['id','created_date','duration_sec','intensity_end','attempts','intervention_outcome']:
        assert first[key]==retry[key],key
    restore_writes(page)
    page.get_by_role('button',name='Retry saving history',exact=True).click()
    page.wait_for_url(args.url+'/')
    saved=records(page);assert len(saved)==1 and saved[0]['id']==first['id']
    assert saved[0]['intensity_end']==6 and saved[0]['attempts'][0]['completed_percentage']==1/6
    assert saved[0]['intervention_outcome']['confirmedActions']==1
    page.goto(args.url+'/return-points')
    expect(page.get_by_text('Synthetic Scene note: an indoor position change.',exact=True)).to_be_visible()
    page.get_by_role('button',name='Delete this note',exact=True).click();context.close()
    print('PASS Change the Scene retains real partial actions, rating, ID/time across failed retry; exactly one verified record; independently saved note survives.',flush=True)

    context,page=create(320);scene_review(page);page.get_by_role('slider').fill('8');block_writes(page,'silent')
    page.get_by_role('button',name='Confirm rating: 8',exact=True).click();error_screen(page)
    before=page.evaluate('history.state.usr.reset_completion')
    page.go_back()
    expect(page.get_by_role('button',name='Begin Change the Scene',exact=False)).to_be_visible()
    page.go_forward()
    expect(page.get_by_role('button',name='Confirm rating: 8',exact=True)).to_be_visible()
    page.reload()
    expect(page.get_by_role('button',name='Confirm rating: 8',exact=True)).to_be_visible()
    assert page.evaluate('history.state.usr.reset_completion.completedAt')==before['completedAt']
    page.get_by_role('button',name='Confirm rating: 8',exact=True).click()
    page.wait_for_url(args.url+'/')
    saved=records(page);assert len(saved)==1 and saved[0]['intensity_end']==8
    assert saved[0]['created_date']==page.evaluate('timestamp => new Date(timestamp).toISOString()',before['completedAt'])
    context.close();print('PASS silent-write failure is surfaced; refresh preserves the confirmed answer and finish timestamp without replay.',flush=True)

    context,page=create(320);scene_review(page)
    page.evaluate("localStorage.setItem('mentation.sessions.v1','{synthetic unreadable history')")
    page.get_by_role('button',name='Skip and finish',exact=True).click();error_screen(page)
    page.add_style_tag(content='html{font-size:150%!important}')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    for button in page.get_by_role('button').all():
        assert button.evaluate('e=>e.scrollWidth<=e.clientWidth')
    page.screenshot(path=str(out/'history-recovery-large-320.png'),full_page=True)
    assert page.evaluate("localStorage.getItem('mentation.sessions.v1')")=='{synthetic unreadable history'
    page.get_by_role('button',name='Return Home without retrying',exact=True).click()
    page.wait_for_url(args.url+'/')
    assert page.evaluate("localStorage.getItem('mentation.sessions.v1')")=='{synthetic unreadable history'
    context.close();print('PASS unreadable history is never overwritten; large-text recovery and deliberate Home return remain usable.',flush=True)

    context,page=create(390);launch(page,'Gentle Tapping')
    page.get_by_role('button',name='Just help me ground',exact=True).click()
    page.get_by_role('button',name='3 out of 10',exact=True).click()
    page.get_by_role('button',name='Begin my round',exact=False).click()
    page.get_by_role('button',name='Pause',exact=True).click()
    page.screenshot(path=str(out/'tapping-original-paused-390.png'),full_page=True)
    page.get_by_role('button',name='Another way',exact=True).click()
    dialog=page.get_by_role('dialog',name='Another way · Gentle Tapping')
    dialog.get_by_role('button',name='Return to Gentle Tapping',exact=True).click()
    expect(page.get_by_role('button',name='Resume my round',exact=True)).to_be_visible()
    page.get_by_role('button',name='Stop round',exact=True).click()
    page.get_by_role('button',name='3 out of 10',exact=True).click()
    page.screenshot(path=str(out/'tapping-original-unchanged-result-390.png'),full_page=True)
    page.get_by_role('button',name='Finish',exact=False).click()
    expect(page.get_by_role('button',name='Skip and finish',exact=True)).to_be_visible()
    block_writes(page);page.get_by_role('button',name='Skip and finish',exact=True).click();error_screen(page)
    restore_writes(page);page.get_by_role('button',name='Retry saving history',exact=True).click()
    page.wait_for_url(args.url+'/');saved=records(page)[0]
    assert saved['attempts'][0]['exit_reason']=='exited' and saved['attempts'][0]['completed_percentage']==0
    assert saved['intervention_outcome']['before']==3 and saved['intervention_outcome']['after']==3
    assert saved['intensity_end'] is None
    context.close();print('PASS original tapping pause/alternative/stop, unchanged own scale, skipped separate goal and retry preserve truthful exit.',flush=True)

    context,page=create(390);launch(page,'Self-Compassion')
    page.get_by_role('button',name='Begin',exact=False).click()
    page.get_by_role('button',name='Skip rating',exact=True).click()
    critical=page.locator('.care-choices button').first.inner_text()
    page.locator('.care-choices button').first.click()
    page.get_by_role('button',name='Try a voice on my side',exact=False).click()
    page.screenshot(path=str(out/'compassion-original-practice-390.png'),full_page=True)
    page.get_by_role('button',name='Choose care without the words',exact=True).click()
    page.get_by_role('textbox',name='Or choose my own step',exact=True).fill('Synthetic care step: rest with a warm drink.')
    page.get_by_role('button',name='Keep this as my next step',exact=False).click()
    page.get_by_role('button',name='Skip rating',exact=True).click()
    page.get_by_role('button',name='Save this card on my device',exact=True).click()
    page.screenshot(path=str(out/'compassion-original-saved-card-390.png'),full_page=True)
    page.get_by_role('button',name='Finish',exact=False).click()
    expect(page.get_by_role('button',name='Skip and finish',exact=True)).to_be_visible()
    block_writes(page);page.get_by_role('button',name='Skip and finish',exact=True).click();error_screen(page)
    page.get_by_role('button',name='Return Home without retrying',exact=True).click()
    page.wait_for_url(args.url+'/');assert records(page)==[]
    page.goto(args.url+'/return-points')
    expect(page.get_by_text('Synthetic care step: rest with a warm drink.',exact=False)).to_be_visible()
    assert page.evaluate("JSON.parse(localStorage.getItem('mentation.carePractices.saved.v1')).selfCompassion.notice")==critical
    page.get_by_role('button',name='Delete saved card',exact=True).click()
    page.reload();expect(page.get_by_text('Synthetic care step: rest with a warm drink.',exact=False)).not_to_be_visible()
    context.close();print('PASS original compassion care-without-words, genuine chosen action, saved native card survives independent history failure and can be deleted.',flush=True)
    assert not errors,errors
    browser.close()
