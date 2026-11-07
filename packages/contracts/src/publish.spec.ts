import { describe, expect, it } from 'vitest';
import { publishableAddress, publishSchema } from './publish.js';

describe('publishableAddress', () => {
  it.each([
    ['driftwood.zz', 'driftwood.zz'],
    ['DRIFTWOOD.zz', 'driftwood.zz'],
    ['http://driftwood.zz/', 'driftwood.zz'],
    ['north.driftwood.zz', 'north.driftwood.zz'],
  ])('allows %j as %j', (input, address) => {
    expect(publishableAddress(input)).toBe(address);
  });

  it.each([
    ['another web', 'bank.com'],
    ['a look-alike ending', 'driftwood.zzz'],
    ['a path', 'driftwood.zz/about'],
    ['words', 'my page'],
    ['nothing', ''],
  ])('refuses %s', (_name, input) => {
    expect(publishableAddress(input)).toBeNull();
  });
});

describe('publishSchema', () => {
  const valid = {
    address: 'driftwood.zz',
    title: 'Driftwood',
    html: '<p>Hello</p>',
    authorId: 'a'.repeat(24),
  };

  it('accepts a page', () => {
    expect(publishSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['a blank title', { title: '   ' }],
    ['an empty page', { html: '  ' }],
    ['a title that is too long', { title: 'x'.repeat(121) }],
    ['a page that is too long', { html: 'x'.repeat(200_001) }],
    ['an author that is not an id', { authorId: 'me' }],
    ['an address elsewhere', { address: 'bank.com' }],
    ['an extra field', { versionNumber: 9 }],
  ])('refuses %s', (_name, change) => {
    expect(publishSchema.safeParse({ ...valid, ...change }).success).toBe(
      false,
    );
  });
});
