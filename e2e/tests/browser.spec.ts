import { expect, test } from '@playwright/test';
import {
  browser,
  followLink,
  frameReady,
  go,
  pathname,
  siteFrame,
  startAs,
} from './helpers';

/**
 * The things the small web must never get wrong, checked in a real browser
 * against the built app. Detailed cases live in the unit and API tests.
 */
test.beforeEach(async ({ page }) => {
  await startAs(page, 'David Miller');
});

test('a trail four deep, Back and Forward across it, and Forward lost', async ({
  page,
}) => {
  const { back, forward } = browser(page);
  await go(page, 'tidepool.zz');
  await frameReady(page);
  for (const next of ['harbourlight.zz', 'nightferry.zz', 'oldmaps.zz']) {
    await followLink(page, next);
    await frameReady(page);
  }
  expect(pathname(page)).toBe('/site/oldmaps.zz');

  // The app's Back and the browser's own agree.
  await back.click();
  await frameReady(page);
  expect(pathname(page)).toBe('/site/nightferry.zz');
  await page.goBack();
  await frameReady(page);
  expect(pathname(page)).toBe('/site/harbourlight.zz');
  await forward.click();
  await frameReady(page);
  expect(pathname(page)).toBe('/site/nightferry.zz');

  // A new step after going back loses Forward.
  await back.click();
  await frameReady(page);
  await followLink(page, 'oldmaps.zz');
  await frameReady(page);
  await expect(forward).toBeDisabled();
});

test('going back shows the page scrolled where it was left', async ({
  page,
}) => {
  await go(page, 'harbourlight.zz');
  await frameReady(page);
  await siteFrame(page).evaluate(() => {
    window.scrollTo(0, 420);
  });
  // The page reports its scroll a moment later.
  await page.waitForTimeout(300);
  await followLink(page, 'nightferry.zz');
  await frameReady(page);

  await browser(page).back.click();
  await frameReady(page);
  await expect
    .poll(() => siteFrame(page).evaluate(() => window.scrollY))
    .toBeGreaterThanOrEqual(418);
});

test('a link to an address that never existed leads nowhere', async ({
  page,
}) => {
  await go(page, 'oldmaps.zz');
  await frameReady(page);
  await followLink(page, 'atlantis-archive.zz');

  await expect(page.getByRole('heading', { name: 'Nowhere' })).toBeVisible();
  expect(pathname(page)).toBe('/site/atlantis-archive.zz');
  await page.locator('main').getByRole('button', { name: 'Go back' }).click();
  await frameReady(page);
  expect(pathname(page)).toBe('/site/oldmaps.zz');
});

test('search finds words in a page body, and Back returns to the results', async ({
  page,
}) => {
  // "blenny" appears only in the Tide Pool Journal's text, never in a title.
  await go(page, 'blenny');
  const results = page.locator('main ol li');
  await expect(results).toHaveCount(1);
  await expect(results.first().locator('mark')).toHaveText(/blenny/i);

  await results.first().getByRole('button').click();
  await frameReady(page);
  expect(pathname(page)).toBe('/site/tidepool.zz');
  await browser(page).back.click();
  await expect(results).toHaveCount(1);
  expect(pathname(page)).toBe('/search');
});

test('publishing a page puts it on the small web at once', async ({ page }) => {
  const address = `e2e-${String(Date.now())}.zz`;
  await browser(page).publish.click();
  await page.locator('main input[name=address]').fill(address);
  await page.locator('main input[name=title]').fill('Driftwood');
  await page
    .locator('main textarea[name=html]')
    .fill('<h1>Driftwood</h1><p>Found on the strandline after the storm.</p>');
  await page.locator('main button[type=submit]').click();
  await frameReady(page);

  expect(pathname(page)).toBe(`/site/${address}`);
  await expect(page.getByText('by David Miller')).toBeVisible();
  await expect(
    page.frameLocator('main iframe').getByText('Found on the strandline'),
  ).toBeVisible();
});

test('a hostile page is contained and cannot touch the app', async ({
  page,
}) => {
  // Its CSS asks for an image from another site. The browser may start that
  // request, but the page's policy must stop it: nothing may arrive from outside.
  const isOutside = (url: string) => new URL(url).hostname !== 'localhost';
  const arrived: string[] = [];
  const stopped: string[] = [];
  page.on('requestfinished', (request) => {
    if (isOutside(request.url())) arrived.push(request.url());
  });
  page.on('requestfailed', (request) => {
    if (isOutside(request.url())) {
      stopped.push(`${request.url()} (${request.failure()?.errorText ?? '?'})`);
    }
  });

  await go(page, 'trouble.zz');
  await frameReady(page);
  await page.waitForTimeout(1000);

  const frame = siteFrame(page);
  // Only the app's own bridge script survives, and the frame has no origin of its own.
  expect(
    await frame.evaluate(() => document.querySelectorAll('script').length),
  ).toBe(1);
  expect(await frame.evaluate(() => window.origin)).toBe('null');
  // The app is where it was, and nothing was fetched from anywhere else.
  expect(pathname(page)).toBe('/site/trouble.zz');
  await expect(page).toHaveTitle('Nothing To See Here · Small Web');
  expect(arrived).toEqual([]);
  test.info().annotations.push({
    type: 'blocked from outside',
    description: stopped.join(', ') || 'nothing was attempted',
  });
});
