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

test.describe('Getting around', () => {
  test.beforeEach(async ({ page }) => {
    await startAs(page, 'Noor Haddad');
  });

  test('typing an address opens the site, tidied up', async ({ page }) => {
    const { address } = browser(page);
    await go(page, '  TidePool.ZZ ');
    await frameReady(page);

    expect(pathname(page)).toBe('/site/tidepool.zz');
    await expect(address).toHaveValue('tidepool.zz');
    await expect(page.getByText('by Mara Quill')).toBeVisible();
    await expect(page).toHaveTitle('The Tide Pool Journal · Small Web');
  });

  test('a trail four deep, with Back and Forward across it', async ({ page }) => {
    const { back, forward } = browser(page);
    await go(page, 'tidepool.zz');
    await frameReady(page);
    for (const next of ['harbourlight.zz', 'nightferry.zz', 'oldmaps.zz']) {
      await followLink(page, next);
      await frameReady(page);
    }
    expect(pathname(page)).toBe('/site/oldmaps.zz');

    for (const expected of ['nightferry.zz', 'harbourlight.zz', 'tidepool.zz']) {
      await back.click();
      await frameReady(page);
      expect(pathname(page)).toBe(`/site/${expected}`);
    }
    for (const expected of ['harbourlight.zz', 'nightferry.zz', 'oldmaps.zz']) {
      await forward.click();
      await frameReady(page);
      expect(pathname(page)).toBe(`/site/${expected}`);
    }
    await expect(forward).toBeDisabled();
  });

  test("the browser's own Back and Forward agree with the app's", async ({ page }) => {
    const { back, forward } = browser(page);
    await go(page, 'tidepool.zz');
    await frameReady(page);
    await followLink(page, 'harbourlight.zz');
    await frameReady(page);
    await followLink(page, 'nightferry.zz');
    await frameReady(page);

    await page.goBack();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/harbourlight.zz');
    await back.click();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/tidepool.zz');
    await page.goForward();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/harbourlight.zz');
    await forward.click();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/nightferry.zz');
  });

  test('a new step after going back loses Forward', async ({ page }) => {
    const { back, forward } = browser(page);
    await go(page, 'tidepool.zz');
    await frameReady(page);
    await followLink(page, 'harbourlight.zz');
    await frameReady(page);
    await followLink(page, 'nightferry.zz');
    await frameReady(page);

    await back.click();
    await frameReady(page);
    await expect(forward).toBeEnabled();
    await followLink(page, 'oldmaps.zz');
    await frameReady(page);

    await expect(forward).toBeDisabled();
    await page.goForward();
    expect(pathname(page)).toBe('/site/oldmaps.zz');
    await back.click();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/harbourlight.zz');
  });

  test('going back shows the page as it was left, scrolled where it was', async ({ page }) => {
    const { back } = browser(page);
    await go(page, 'harbourlight.zz');
    await frameReady(page);
    await siteFrame(page).evaluate(() => {
      window.scrollTo(0, 420);
    });
    // The page reports its scroll a moment later.
    await page.waitForTimeout(300);
    await followLink(page, 'nightferry.zz');
    await frameReady(page);

    await back.click();
    await frameReady(page);
    await expect
      .poll(() => siteFrame(page).evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(418);
  });

  test('a refresh keeps the page, its scroll and the trail', async ({ page }) => {
    const { back } = browser(page);
    await go(page, 'tidepool.zz');
    await frameReady(page);
    await followLink(page, 'harbourlight.zz');
    await frameReady(page);
    await siteFrame(page).evaluate(() => {
      window.scrollTo(0, 360);
    });
    await page.waitForTimeout(300);

    await page.reload();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/harbourlight.zz');
    await expect
      .poll(() => siteFrame(page).evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(358);
    await back.click();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/tidepool.zz');
  });

  test('a link to an address that never existed leads nowhere, a real stop', async ({ page }) => {
    const { forward } = browser(page);
    await go(page, 'oldmaps.zz');
    await frameReady(page);
    await followLink(page, 'atlantis-archive.zz');

    await expect(page.getByRole('heading', { name: 'Nowhere' })).toBeVisible();
    expect(pathname(page)).toBe('/site/atlantis-archive.zz');
    await expect(page.locator('main').getByText('atlantis-archive.zz', { exact: true })).toBeVisible();

    await page.locator('main').getByRole('button', { name: 'Go back' }).click();
    await frameReady(page);
    expect(pathname(page)).toBe('/site/oldmaps.zz');
    await forward.click();
    await expect(page.getByRole('heading', { name: 'Nowhere' })).toBeVisible();
  });

  test('words that are not an address become a search', async ({ page }) => {
    await go(page, 'lighthouse keeper');
    await expect(page.locator('main mark').first()).toBeVisible();
    expect(pathname(page)).toBe('/search');
    expect(new URL(page.url()).searchParams.get('q')).toBe('lighthouse keeper');
  });
});
