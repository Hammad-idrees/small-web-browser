import { expect, type Frame, type Page } from '@playwright/test';
import { API_URL } from '../settings';

/** The browser's own controls, found the way a person or screen reader would. */
export function browser(page: Page) {
  return {
    address: page.getByRole('textbox', { name: 'Address', exact: true }),
    back: page.getByRole('button', { name: 'Back', exact: true }),
    forward: page.getByRole('button', { name: 'Forward', exact: true }),
    history: page.getByRole('button', { name: 'History', exact: true }),
    publish: page.getByRole('button', { name: 'Publish', exact: true }),
    person: page.getByRole('button', { name: /^Browsing as/ }),
  };
}

export const pathname = (page: Page) => new URL(page.url()).pathname;

/** Waits until nothing is loading and the site's frame is showing. */
export async function frameReady(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('[role=progressbar]'));
  await page.waitForFunction(() => {
    const frame = document.querySelector('main iframe');
    return frame !== null && getComputedStyle(frame).opacity === '1';
  });
}

/** The contained page's own frame. */
export function siteFrame(page: Page): Frame {
  const frame = page.frames().find((f) => f.url().includes('/render/versions/'));
  if (!frame) throw new Error('No site is showing');
  return frame;
}

/** Follows a link inside the shown site, as a reader would. */
export async function followLink(page: Page, href: string): Promise<void> {
  await page.frameLocator('main iframe').locator(`a[href="${href}"]`).first().click();
}

/** Starts on the start page as the given person. */
export async function startAs(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('A small web,')).toBeVisible();
  await choosePerson(page, name);
}

export async function choosePerson(page: Page, name: string): Promise<void> {
  const { person } = browser(page);
  if ((await person.getAttribute('aria-label')) === `Browsing as ${name}`) return;
  await person.click();
  await page.getByRole('option', { name, exact: true }).click();
  await expect(person).toHaveAttribute('aria-label', `Browsing as ${name}`);
}

/** Types into the address bar and presses Enter. */
export async function go(page: Page, text: string): Promise<void> {
  const { address } = browser(page);
  await address.fill(text);
  await address.press('Enter');
}

/** The scrollable pane of an app page, such as search or history. */
export function scrollPane(page: Page, y: number) {
  return page.evaluate((top) => {
    const pane = document.querySelector('main > div');
    if (pane) pane.scrollTop = top;
  }, y);
}

interface Person {
  readonly id: string;
  readonly name: string;
}

interface Visit {
  readonly address: string;
  readonly via: string;
  readonly found: boolean;
}

/** Straight from the API: who exists. */
export async function people(): Promise<Person[]> {
  const response = await fetch(`${API_URL}/api/people`);
  return (await response.json()) as Person[];
}

/** Straight from the API: a person's most recent visits, newest first. */
export async function latestVisits(name: string, limit = 5): Promise<Visit[]> {
  const person = (await people()).find((p) => p.name === name);
  if (!person) throw new Error(`No person called ${name}`);
  const response = await fetch(
    `${API_URL}/api/people/${person.id}/visits?limit=${String(limit)}`,
  );
  return ((await response.json()) as { visits: Visit[] }).visits;
}
