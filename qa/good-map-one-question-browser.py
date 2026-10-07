"""One-question Good Map regression using real cards, answers, navigation and local saves.
Run against the app's dev/preview server; no test fixtures are installed in production.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:5194')
parser.add_argument('--out', default='/tmp/good-map-one-question')
parser.add_argument('--prior-envelope', help='Optional actual previous-release v4 envelope')
args = parser.parse_args()
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
key = 'goodmap-journey-v4'
results, errors = [], []


def saved(p):
    return p.evaluate("JSON.parse(localStorage.getItem('goodmap-journey-v4'))")


def primary(p):
    assert p.locator('.jfoot .rcta').count() == 1
    assert p.locator('.jq').count() == 1
    assert p.locator('.jq').evaluate('(e) => e.tagName === "H1"')
    assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')


def shot(p, name, width):
    primary(p)
    p.screenshot(path=str(out / f'after-{name}-{width}.png'), full_page=True)


def next(p):
    p.locator('#jnext').click()


def sort(p):
    p.goto(args.base + '/good-map/index.html')
    p.locator('#gmStart').click()
    for n in range(16):
        p.locator(f'.tray[data-v="{3 if n < 2 else 0}"]').click()
        p.wait_for_function('!busy')
    p.locator('#torate').click()


def storage(p, denied):
    p.evaluate('''denied => {
      window.gmRealSet ||= Storage.prototype.setItem;
      Storage.prototype.setItem = function(k,v) {
        if (denied && k === 'goodmap-journey-v4') throw new DOMException('QA only', 'QuotaExceededError');
        return window.gmRealSet.call(this,k,v);
      };
    }''', denied)


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width in (320, 390):
        context = browser.new_context(viewport={'width': width, 'height': 640}, reduced_motion='reduce')
        p = context.new_page()
        p.on('pageerror', lambda e: errors.append(str(e)))
        sort(p)
        assert p.locator('#gmLoss,#gmRhythm').count() == 0
        p.locator('[data-rating="0"]').focus()
        p.keyboard.press('Space')
        expect(p.locator('[data-rating="0"]')).to_be_focused()
        p.locator('#rnext').focus()
        p.keyboard.press('Enter')
        p.locator('[data-rating="7"]').click()
        p.reload()
        expect(p.locator('[data-rating="7"]')).to_have_attribute('aria-pressed', 'true')
        p.go_back()
        expect(p.locator('[data-rating="0"]')).to_have_attribute('aria-pressed', 'true')
        p.go_forward()
        expect(p.locator('[data-rating="7"]')).to_have_attribute('aria-pressed', 'true')
        shot(p, 'importance', width)
        p.locator('#rnext').click()
        p.locator('.gm-mk').first.click()
        p.locator('#gmEditContext').click()
        assert p.locator('[data-context]').count() > 1 and p.locator('[data-rating]').count() == 0
        p.locator('[data-context="2"]').click()
        shot(p, 'context-loss', width)
        next(p)
        p.locator('[data-context="1"]').click()
        shot(p, 'context-rhythm', width)
        p.reload()
        expect(p.locator('[data-context="1"]')).to_have_attribute('aria-pressed', 'true')
        p.locator('#gmBack').click()
        expect(p.locator('[data-context="2"]')).to_have_attribute('aria-pressed', 'true')
        next(p)
        next(p)
        p.locator('#mapok').click()
        p.locator('#gmInterpretation').fill('Disposable meaning from my own words')
        next(p)
        assert p.locator('[data-rating]').count() == 11
        p.locator('[data-rating="3"]').click()
        baseline_question = p.locator('.jq').inner_text()
        shot(p, 'satisfaction-first', width)
        next(p)
        assert p.locator('[data-rating]').count() == 11
        assert p.locator('.jq').inner_text() != baseline_question
        shot(p, 'satisfaction-second', width)
        p.reload()
        p.go_back()
        expect(p.locator('[data-rating="3"]')).to_have_attribute('aria-pressed', 'true')
        next(p)
        p.locator('#gmSkipSat').click()
        data = saved(p)
        assert sorted(v for v in data['state']['RATE'].values()) == [0, 7]
        assert list(data['state']['JST']['sat'].values()).count(None) == 1
        assert data['state']['LOSS'] and data['state']['RHY']
        p.locator('[data-focus]').first.click()
        next(p)
        shot(p, 'already-helps', width)
        next(p)
        p.locator('[data-b]').first.click()
        shot(p, 'barrier', width)
        next(p)
        p.locator('[data-u]').first.click()
        shot(p, 'change', width)
        next(p)
        expect(p.locator('.gm-later-steps')).not_to_have_attribute('open', '')
        shot(p, 'one-step', width)
        next(p)
        # Date and time are two fields answering one When question.
        assert p.locator('#gmDate').count() == 1 and p.locator('#gmTime').count() == 1
        p.locator('#gmDate').fill('')
        next(p)
        expect(p.locator('#gmStatus')).to_have_text('Choose a date and time.')
        p.locator('#gmDate').fill('2027-02-01')
        p.locator('#gmTime').fill('09:30')
        p.reload()
        expect(p.locator('#gmDate')).to_have_value('2027-02-01')
        expect(p.locator('#gmTime')).to_have_value('09:30')
        p.locator('#gmBack').click()
        expect(p.locator('#jc1')).to_be_visible()
        next(p)
        expect(p.locator('#gmDate')).to_have_value('2027-02-01')
        expect(p.locator('#gmTime')).to_have_value('09:30')
        shot(p, 'schedule', width)
        storage(p, True)
        next(p)
        expect(p.locator('#gmStatus')).to_contain_text('Not saved')
        assert p.locator('#gmTime').count() == 1
        storage(p, False)
        next(p)
        next(p)
        next(p)
        p.get_by_role('button', name='Partly', exact=True).click()
        assert p.locator('.jq').inner_text() == baseline_question
        assert p.locator('[data-helpful]').count() == 0
        p.locator('[data-rating="0"]').click()
        shot(p, 'followup-rating', width)
        next(p)
        assert p.locator('[data-rating]').count() == 0
        assert p.locator('[data-helpful]').count() == 4
        p.get_by_role('button', name='Unhelpful', exact=True).click()
        shot(p, 'helpfulness', width)
        p.reload()
        expect(p.get_by_role('button', name='Unhelpful', exact=True)).to_have_attribute('aria-pressed', 'true')
        p.go_back()
        expect(p.locator('[data-rating="0"]')).to_have_attribute('aria-pressed', 'true')
        next(p)
        next(p)
        data = saved(p)
        assert len(data['state']['JST']['log']) == 1
        report = data['state']['JST']['log'][0]
        assert (report['baseline'], report['endpoint'], report['helpfulness'], report['did']) == (3, 0, 'worse', 'part')
        assert not data['state']['JST']['done']
        p.locator('#gmHome').click()
        p.locator('#gmMenu').click()
        p.get_by_role('button', name='Preview a private export', exact=True).click()
        assert p.locator('#gmConsent').count() == 0
        p.locator('#gmRecipient').fill('Disposable reviewer')
        shot(p, 'export-recipient', width)
        p.locator('#gmPreviewExport').click()
        assert p.locator('#gmRecipient').count() == 0
        expect(p.locator('#gmExport')).to_be_disabled()
        shot(p, 'export-consent', width)
        assert 'Disposable reviewer' not in json.dumps(p.evaluate('history.state'))
        assert 'Disposable reviewer' not in json.dumps(saved(p))
        p.reload()
        expect(p.locator('#gmRecipient')).to_have_value('')
        expect(p.locator('#gmPreviewExport')).to_be_disabled()
        p.locator('#gmCancelShare').click()
        p.get_by_role('button', name='Delete all Good Map data', exact=True).click()
        p.locator('#gmDeleteConfirm').click()
        p.reload()
        assert not saved(p)['maps'] and not saved(p)['state']['hist']
        assert 'Disposable' not in json.dumps(saved(p))
        p.go_back()
        expect(p.locator('#gmStart')).to_be_visible()
        assert 'Disposable' not in json.dumps(saved(p))
        p.locator('#gmStart').click()
        assert p.evaluate('i') == 0
        results.append({'width': width, 'height': 640, 'oneQuestion': True, 'singlePrimary': True, 'keyboardSelection': True, 'browserBackForwardAfterRefresh': True, 'allInputsRetained': True, 'selfReportedOutcome': True, 'privateFreshConsent': True, 'storageFailureRecovery': True, 'deleteAndRepeat': True})
        context.close()
    if args.prior_envelope:
        old = json.loads(Path(args.prior_envelope).read_text())
        for width in (320, 390):
            c = browser.new_context(viewport={'width': width, 'height': 844}, reduced_motion='reduce')
            p = c.new_page()
            p.add_init_script("if (!localStorage.getItem('goodmap-journey-v4')) localStorage.setItem('goodmap-journey-v4', " + json.dumps(json.dumps(old)) + ");")
            p.goto(args.base + '/good-map/index.html')
            assert p.locator('[data-rating]').count() == 11
            now = saved(p) or old
            for field in ['RATE', 'LOSS', 'RHY', 'TOV', 'hist', 'ORDER']:
                assert now['state'][field] == old['state'][field]
            assert p.locator('[data-rating="3"]').get_attribute('aria-pressed') == 'true'
            next(p)
            assert p.locator('[data-rating="4"]').get_attribute('aria-pressed') == 'true'
            assert saved(p)['state']['JST']['interpretation'] == old['state']['JST']['interpretation']
            results.append({'width': width, 'actualV4Migration': True, 'exactPriorRatingsContextInterpretation': True})
            c.close()
    if args.prior_envelope:
        for old_phase in ('when', 'win'):
            fixture = Path(args.prior_envelope).with_name('prior-release-v4-' + old_phase + '.json')
            if not fixture.exists():
                continue
            old = json.loads(fixture.read_text())
            for width in (320, 390):
                c = browser.new_context(viewport={'width': width, 'height': 640}, reduced_motion='reduce')
                p = c.new_page()
                p.add_init_script("if(!localStorage.getItem('goodmap-journey-v4'))localStorage.setItem('goodmap-journey-v4'," + json.dumps(json.dumps(old)) + ");")
                p.goto(args.base + '/good-map/index.html')
                primary(p)
                if old_phase == 'when':
                    expect(p.locator('#gmDate')).to_have_value(old['state']['JST']['wk']['date'])
                    expect(p.locator('#gmTime')).to_have_value(old['state']['JST']['wk']['time'])
                    p.locator('#gmMenu').click()
                    p.get_by_role('button', name='Use larger text', exact=True).click()
                    p.locator('#gmBack').click()
                    expect(p.locator('#gmTime')).to_have_value(old['state']['JST']['wk']['time'])
                    assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
                    shot(p, 'prior-schedule-large', width)
                else:
                    expect(p.locator('[data-rating="0"]')).to_have_attribute('aria-pressed', 'true')
                    next(p)
                    expect(p.get_by_role('button', name='Unhelpful', exact=True)).to_have_attribute('aria-pressed', 'true')
                    assert saved(p)['state']['JST']['baseline'] == old['state']['JST']['baseline']
                    assert saved(p)['state']['JST']['attemptId'] == old['state']['JST']['attemptId']
                    assert saved(p)['state']['JST']['chk'] == old['state']['JST']['chk']
                results.append({'width': width, 'actualV4Phase': old_phase, 'exactPriorInputsRetainedAcrossSplit': True, 'largerText': old_phase == 'when'})
                c.close()
    # Native host journey: local history keeps the iframe/answers mounted; alternative returns intact.
    for width in (320, 390):
        c = browser.new_context(viewport={'width': width, 'height': 844}, reduced_motion='reduce')
        c.add_init_script("if(window.top===window)localStorage.setItem('haven_onboarded','1')")
        p = c.new_page()
        p.goto(args.base + '/good-map')
        frame = p.frame_locator('iframe[title="The Good Map"]')
        frame.locator('#gmStart').click(timeout=20000)
        p.wait_for_function("history.state?.['menticationScreen:goodMap']?.id === 'sort'")
        assert frame.locator('.tray').count() > 0
        p.get_by_role('button', name='Another way', exact=True).click()
        p.get_by_role('dialog').wait_for()
        p.keyboard.press('Escape')
        p.get_by_role('dialog').wait_for(state='hidden')
        assert frame.locator('.tray').count() > 0
        p.reload()
        frame.locator('.tray').first.wait_for(timeout=20000)
        # The host restores the screen even when an app refresh recreates the iframe.
        p.evaluate('history.back()')
        expect(frame.locator('#gmStart')).to_be_visible()
        p.evaluate('history.forward()')
        frame.locator('.tray').first.wait_for()
        p.wait_for_function("history.state?.['menticationScreen:goodMap']?.id === 'sort'")
        p.evaluate('history.back()')
        expect(frame.locator('#gmStart')).to_be_visible()
        frame.locator('#gmBack').click()
        p.wait_for_url(args.base + '/', timeout=10000)
        results.append({'width': width, 'nativeRouteAlternativeReturn': True, 'nativeBrowserBackForwardAfterWholeAppRefresh': True, 'firstScreenBackExitsToHost': True})
        c.close()
    assert not errors, errors
    browser.close()
(out / 'results.json').write_text(json.dumps({'results': results, 'errors': errors}, indent=2))
print('PASS one-question Good Map:', len(results), 'mobile flow/migration/native cases')
