import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// Never activate phone or external-directory links in automated checks.
export async function checkCrisisSupport(page, base) {
  await page.goto(`${base}/support`);
  await page.getByRole('heading', { name: 'If you’re in crisis right now', exact: true }).waitFor();
  const international = page.getByRole('region', { name: 'Outside Australia?', exact: true });
  const australia = page.getByRole('region', { name: 'In Australia', exact: true });
  assert(await international.isVisible());
  assert(await australia.isVisible());
  assert.deepEqual(await page.locator('a[href^="tel:"]').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), labeled: link.textContent.includes('Australia') }))),
    ['tel:000', 'tel:131114', 'tel:1300224636', 'tel:1300659467'].map(href => ({ href, labeled: true })));
  const directory = page.getByRole('link', { name: 'Find a helpline in your country (opens in a new tab)', exact: true });
  assert.equal(await directory.getAttribute('href'), 'https://findahelpline.com');
  assert.equal(await directory.getAttribute('target'), '_blank');
  assert.equal(await page.locator('#local-emergency-guidance').evaluate(node => Boolean(node.compareDocumentPosition(document.querySelector('#international-support-heading')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  assert.equal(await international.evaluate(node => Boolean(node.compareDocumentPosition(document.querySelector('a[href^="tel:"]')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);

  // Both a small phone and enlarged browser text must reflow, with usable links.
  const screenshotDir = 'output/support-region-qa';
  await mkdir(screenshotDir, { recursive:true });
  for (const colorScheme of ['light', 'dark']) {
  await page.emulateMedia({ colorScheme });
  await page.waitForFunction(dark => document.documentElement.classList.contains('dark') === dark, colorScheme === 'dark');
  assert.equal(await page.locator('#local-emergency-guidance').evaluate(node => getComputedStyle(node).getPropertyValue('--cream').trim()), '37 41% 87%', 'Urgent guidance must remain light on its dark surface');
  for (const [width, fontSize] of [[390, '100%'], [320, '100%'], [320, '200%']]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
    assert.equal(await page.locator('html').evaluate(node => node.scrollWidth > innerWidth + 1), false, `Support overflows at ${width}px / ${fontSize}`);
    for (const control of [directory, ...await page.locator('a[href^="tel:"]').all(), page.getByRole('button', { name: 'Optional calming practice', exact: true })]) {
      const box = await control.boundingBox();
      assert(box && box.height >= 44 && box.width <= width, 'Support controls must remain large enough and fit the viewport');
      assert(await control.evaluate(node => node.scrollHeight <= node.clientHeight + 1), 'Support text is clipped');
    }
    assert(await international.evaluate(node => node.getBoundingClientRect().bottom <= document.querySelector('#australian-support-heading').getBoundingClientRect().top), 'International and Australian sections overlap');
    await page.screenshot({ path:`${screenshotDir}/${page.context().browser().browserType().name()}-${colorScheme}-${width}-${fontSize.replace('%','')}.png`, fullPage:true });
  }
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await page.setViewportSize({ width:390, height:844 });
  await page.getByRole('button', { name: 'Back', exact: true }).focus();
  await page.keyboard.press('Tab');
  assert(await directory.evaluate(node => document.activeElement === node), 'International support must precede Australian numbers in keyboard order');
  await page.keyboard.press('Tab');
  assert(await page.locator('a[href="tel:000"]').evaluate(node => document.activeElement === node));
  await page.reload();
  await page.getByRole('heading', { name: 'If you’re in crisis right now', exact: true }).waitFor();

  await page.goto(`${base}/settings`);
  await page.getByRole('button', { name: 'Crisis support', exact: true }).click();
  await page.getByRole('heading', { name: 'If you’re in crisis right now', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Crisis support', exact: true }).waitFor();
}
