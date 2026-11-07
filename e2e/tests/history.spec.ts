import { expect, test } from '@playwright/test';
import {
  browser,
  choosePerson,
  followLink,
  frameReady,
  go,
  latestVisits,
  pathname,
  scrollPane,
  startAs,
} from './helpers';

test.describe('History', () => {
  test('records each arrival and how it happened, but not Back or Forward', async ({ page }) => {
    const { back, forward } = browser(page);
    await startAs(page, 'Ines Okoye');
    const before = (await latestVisits('Ines Okoye', 50)).length;

    await go(page, 'mossgarden.zz');
    await frameReady(page);
    await followLink(page, 'slowdough.zz');
    await frameReady(page);
    await back.click();
    await frameReady(page);
    await forward.click();
    await frameReady(page);
    await page.reload();
    await frameReady(page);

    await expect.poll(async () => (await latestVisits('Ines Okoye', 50)).length).toBe(before + 2);
    const [newest, previous] = await latestVisits('Ines Okoye', 2);
    expect(newest).toMatchObject({ address: 'slowdough.zz', via: 'link', found: true });
    expect(previous).toMatchObject({ address: 'mossgarden.zz', via: 'typed', found: true });
  });

  test('records a dead address too', async ({ page }) => {
    await startAs(page, 'Sol Verano');
    await go(page, 'shortwave.zz');
    await frameReady(page);
    await followLink(page, 'quietradio.zz');
    await expect(page.getByRole('heading', { name: 'Nowhere' })).toBeVisible();

    await expect
      .poll(async () => (await latestVisits('Sol Verano', 1))[0])
      .toMatchObject({ address: 'quietradio.zz', found: false, via: 'link' });
  });

  test('shows each person their own history, and opens a visit again', async ({ page }) => {
    await startAs(page, 'Theo Lindqvist');
    await browser(page).history.click();
    await expect(page.getByText('Theo Lindqvist’s trail')).toBeVisible();
    const theos = await page.locator('main ol li').first().innerText();

    await choosePerson(page, 'Mara Quill');
    await browser(page).history.click();
    await expect(page.getByText('Mara Quill’s trail')).toBeVisible();
    await expect(page.locator('main ol li').first()).not.toHaveText(theos);

    const first = page.locator('main ol li').first();
    const address = (await first.locator('[class*="address"]').innerText()).trim();
    await first.getByRole('button').click();
    expect(pathname(page)).toBe(`/site/${address}`);
    await expect
      .poll(async () => (await latestVisits('Mara Quill', 1))[0]?.via)
      .toBe('history');
  });

  test('scrolls through a long history to the very start', async ({ page }) => {
    // Bram has been nearly everywhere: more than one page of history.
    await startAs(page, 'Bram Ottley');
    await browser(page).history.click();
    await expect(page.locator('main ol li').first()).toBeVisible();

    await expect(async () => {
      await scrollPane(page, 1_000_000);
      await expect(page.getByText('That is everywhere')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });
    expect(await page.locator('main ol li').count()).toBeGreaterThan(20);
  });
});
