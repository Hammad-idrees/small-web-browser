import { expect, type Frame, type Page } from '@playwright/test';

/** The browser's own controls, found the way a person or screen reader would. */
export function browser(page: Page) {
  return {
    address: page.getByRole('textbox', { name: 'Address', exact: true }),
    back: page.getByRole('button', { name: 'Back', exact: true }),
    forward: page.getByRole('button', { name: 'Forward', exact: true }),
    publish: page.getByRole('button', { name: 'Publish', exact: true }),
    person: page.getByRole('button', { name: /^Browsing as/ }),
  };
}

export const pathname = (page: Page) => new URL(page.url()).pathname;

/** Waits until nothing is loading and the site's frame is showing. */
export async function frameReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !document.querySelector('[role=progressbar]'),
  );
  await page.waitForFunction(() => {
    const frame = document.querySelector('main iframe');
    return frame !== null && getComputedStyle(frame).opacity === '1';
  });
}

/** The contained page's own frame. */
export function siteFrame(page: Page): Frame {
  const frame = page
    .frames()
    .find((f) => f.url().includes('/render/versions/'));
  if (!frame) throw new Error('No site is showing');
  return frame;
}

/** Follows a link inside the shown site, as a reader would. */
export async function followLink(page: Page, href: string): Promise<void> {
  await page
    .frameLocator('main iframe')
    .locator(`a[href="${href}"]`)
    .first()
    .click();
}

/** Types into the address bar and presses Enter. */
export async function go(page: Page, text: string): Promise<void> {
  const { address } = browser(page);
  await address.fill(text);
  await address.press('Enter');
}

/** Starts on the start page, browsing as the given person. */
export async function startAs(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('A small web,')).toBeVisible();
  const { person } = browser(page);
  if ((await person.getAttribute('aria-label')) !== `Browsing as ${name}`) {
    await person.click();
    await page.getByRole('option', { name, exact: true }).click();
  }
  await expect(person).toHaveAttribute('aria-label', `Browsing as ${name}`);
}
