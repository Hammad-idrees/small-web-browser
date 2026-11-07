import { expect, test } from '@playwright/test';
import { browser, frameReady, go, pathname, startAs } from './helpers';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await startAs(page, 'Noor Haddad');
  });

  test('finds a page by a word only in its body, and marks it', async ({ page }) => {
    // "blenny" appears in the Tide Pool Journal's text, never in a title.
    await go(page, 'blenny');
    const results = page.locator('main ol li');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('tidepool.zz');
    await expect(results.first().locator('mark')).toHaveText(/blenny/i);
    await expect(page.getByText('One page found')).toBeVisible();
  });

  test('a title match ranks above a body match', async ({ page }) => {
    await go(page, 'tide');
    const first = page.locator('main ol li').first();
    await expect(first).toContainText('The Tide Pool Journal');
  });

  test('Back from a result returns to the same results', async ({ page }) => {
    const { back } = browser(page);
    await go(page, 'tide');
    const results = page.locator('main ol li');
    await expect(results.first()).toBeVisible();
    const count = await results.count();

    await results.nth(1).getByRole('button').click();
    await frameReady(page);
    expect(pathname(page)).toMatch(/^\/site\//);

    await back.click();
    await expect(page.locator('main mark').first()).toBeVisible();
    expect(pathname(page)).toBe('/search');
    await expect(results).toHaveCount(count);
  });

  test('says so when nothing matches', async ({ page }) => {
    await go(page, 'zzqqxx nothing');
    await expect(page.getByText(/No page mentions that/)).toBeVisible();
  });
});
