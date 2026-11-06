import { describe, expect, it } from 'vitest';
import { normalizeAddress } from './address.js';

describe('normalizeAddress', () => {
  it.each([
    ['tidepool.zz', 'tidepool.zz'],
    ['TIDEPOOL.zz', 'tidepool.zz'],
    ['  tidepool.zz  ', 'tidepool.zz'],
    ['tidepool.zz/', 'tidepool.zz'],
    ['http://tidepool.zz', 'tidepool.zz'],
    ['HTTPS://TidePool.ZZ/', 'tidepool.zz'],
    ['//tidepool.zz', 'tidepool.zz'],
    ['tidepool.zz#top', 'tidepool.zz'],
    ['tidepool.zz/?from=harbour', 'tidepool.zz'],
    ['old-maps.zz', 'old-maps.zz'],
    ['north.old-maps.zz', 'north.old-maps.zz'],
    ['example.com', 'example.com'],
  ])('reads %j as %j', (input, expected) => {
    expect(normalizeAddress(input)).toBe(expected);
  });

  it.each([
    [''],
    ['   '],
    ['tidepool'],
    ['a page about tides'],
    ['tidepool.zz/about'],
    ['tidepool.zz//'],
    ['tidepool.zz:8080'],
    ['user@tidepool.zz'],
    ['tidepool.zz.'],
    ['.zz'],
    ['-tidepool.zz'],
    ['tidepool-.zz'],
    ['tide_pool.zz'],
    ['tidepool.z'],
    ['1.2.3.4'],
    ['ftp://tidepool.zz'],
    ['javascript:alert(1)'],
    ['data:text/html,hello'],
    ['tide\npool.zz'],
    ['tidepool.zz\n/evil'],
    [`${'a'.repeat(64)}.zz`],
    [`${'a.'.repeat(1100)}zz`],
  ])('rejects %j', (input) => {
    expect(normalizeAddress(input)).toBeNull();
  });

  it('is idempotent', () => {
    const once = normalizeAddress('HTTP://TidePool.zz/');
    expect(normalizeAddress(once ?? '')).toBe(once);
  });
});
