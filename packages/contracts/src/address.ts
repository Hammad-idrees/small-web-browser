const MAX_INPUT_LENGTH = 2048;

/** One or more dot-separated labels, then an alphabetic final label: `tidepool.zz`. */
const ADDRESS_SHAPE =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/**
 * Reduces anything that means an address to its one canonical form, so that
 * `TIDEPOOL.zz`, `http://tidepool.zz/` and ` tidepool.zz#top ` are the same page.
 *
 * Returns null when the input is not address-shaped. A site is a single page,
 * so a path such as `tidepool.zz/about` is not an address.
 */
export function normalizeAddress(input: string): string | null {
  if (input.length > MAX_INPUT_LENGTH) return null;

  const address = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '');

  return ADDRESS_SHAPE.test(address) ? address : null;
}
