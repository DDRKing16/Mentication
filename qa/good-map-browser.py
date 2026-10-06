"""Built-app regression: python3 qa/good-map-browser.py (requires Playwright).
Uses only disposable browser contexts and synthetic answers. Serve npm run preview first.
"""
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:5173/good-map/index.html')
parser.add_argument('--screenshots', default='/tmp/good-map-regression')
args = parser.parse_args()
out = Path(args.screenshots)
out.mkdir(parents=True, exist_ok=True)


def sort_cards(page, selected=4):
    page.goto(args.url)
    page.locator('#gmStart').click()
    for n in range(16):
        page.locator(f'.tray[data-v="{3 if n < selected else 0}"]').click()
        page.wait_for_function('!busy')
    page.locator('#torate').click()


def visible_map(page, count=3):
    canvas = page.locator('.gm-stage')
    # Entrance animations start planets outside the clipped canvas.
    page.wait_for_function("Array.from(document.querySelectorAll('.gm-mk')).every(node => node.getAnimations().every(animation => animation.playState === 'finished'))")
    box = canvas.bounding_box()
    assert box and box['width'] >= 250 and box['height'] >= 300, box
    assert abs(box['height'] / box['width'] - 440 / 350) < .01, box
    assert page.locator('.gm-rings .gm-disc').count() == 3
    assert page.locator('.gm-mk').count() == count
    assert page.locator('.gm-you').is_visible()
    for node in page.locator('.gm-mk').all():
        assert node.is_visible()
        rect = node.bounding_box()
        assert rect['width'] > 0 and rect['height'] > 0
        assert rect['x'] < box['x'] + box['width'] and rect['x'] + rect['width'] > box['x']
        assert rect['y'] < box['y'] + box['height'] and rect['y'] + rect['height'] > box['y']
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width in (320, 390, 1440):
        for motion in ('reduce', 'no-preference'):
            context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion=motion)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            sort_cards(page)
            for rating in (9, 5, 0):
                page.locator(f'[data-rating="{rating}"]').click()
                page.locator('#rnext').click()
            page.locator('#gmSkipRating').click()
            visible_map(page)
            page.locator('.gm-stage').scroll_into_view_if_needed()
            # Finish entrance animations before inspecting screenshot pixels.
            page.wait_for_timeout(1600 if motion == 'no-preference' else 50)
            page.locator('.jpeek').wait_for(state='detached')
            page.screenshot(path=str(out / f'map-{width}-{motion}.png'), full_page=True)
            node = page.locator('.gm-mk').first
            key = node.get_attribute('data-k')
            node.click()
            page.locator('[data-ring="2"]').click()
            assert page.locator(f'.gm-mk[data-k="{key}"]').get_attribute('class').split().count('t2') == 1
            page.locator('[data-view="list"]').click()
            assert page.locator('.rrow').count() == 3
            assert page.locator('.gm-stage').count() == 0
            page.locator('.rrow').first.focus()
            page.keyboard.press('Enter')
            assert page.locator('#gmEditRating').is_visible()
            page.get_by_role('button', name='Close', exact=True).click()
            page.locator('[data-view="sky"]').click()
            visible_map(page)
            page.locator('#mapok').click()
            page.locator('#gmBack').click()
            visible_map(page)
            page.reload()
            visible_map(page)
            assert 't2' in page.locator(f'.gm-mk[data-k="{key}"]').get_attribute('class').split()
            saved = page.evaluate("JSON.parse(localStorage.getItem('goodmap-journey-v4'))")
            assert sorted(v for v in saved['state']['RATE'].values() if v is not None) == [0, 5, 9]
            assert list(saved['state']['RATE'].values()).count(None) == 1
            assert len(saved['maps']) == 1
            assert saved['maps'][0]['rings'][key] == 2
            page.locator('#gmExit').click()
            page.locator('#gmResume').click()
            visible_map(page)
            assert not errors, errors
            context.close()
    # An entirely unanswered map must show the explicit empty state, not a blank canvas.
    context = browser.new_context(reduced_motion='reduce')
    page = context.new_page()
    sort_cards(page, selected=1)
    page.locator('#gmSkipRating').click()
    assert page.get_by_text('NO RATINGS YET', exact=True).is_visible()
    assert page.locator('.gm-stage').count() == 0
    page.locator('#gmKeepEmpty').click()
    saved = page.evaluate("JSON.parse(localStorage.getItem('goodmap-journey-v4'))")
    assert len(saved['maps']) == 1
    assert all(v is None for v in saved['maps'][0]['ratings'].values())
    context.close()
    browser.close()
print('PASS: 320/390/1440, both motion preferences, rings/nodes, ring edits, Map/List, back/reload/resume, saved zero/null ratings, empty state')
