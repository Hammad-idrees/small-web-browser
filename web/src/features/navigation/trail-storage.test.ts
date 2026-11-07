import { describe, expect, it } from 'vitest';
import { parseStoredTrail } from './trail-storage';

const VERSION_ID = 'a'.repeat(24);

const entry = (id: string, location: unknown = { kind: 'home' }) => ({
  id,
  ownerId: 'owner',
  location,
  scrollY: 0,
});

describe('parseStoredTrail', () => {
  it('reads back a stored trail, with nothing pending', () => {
    const stored = {
      entries: [
        entry('1'),
        entry('2', {
          kind: 'site',
          address: 'a.zz',
          versionId: VERSION_ID,
          title: 'A',
          authorName: 'B',
        }),
        entry('3', { kind: 'nowhere', address: 'dead.zz' }),
        entry('4', { kind: 'search', query: 'tide' }),
      ],
      index: 2,
    };
    expect(parseStoredTrail(JSON.stringify(stored))).toEqual({
      ...stored,
      pending: null,
    });
  });

  it.each([
    ['nothing', null],
    ['broken JSON', '{not json'],
    ['the wrong shape', '{"entries":"x","index":0}'],
    [
      'a position past the end',
      JSON.stringify({ entries: [entry('1')], index: 1 }),
    ],
    [
      'a negative position',
      JSON.stringify({ entries: [entry('1')], index: -1 }),
    ],
    [
      'an unknown kind of page',
      JSON.stringify({ entries: [entry('1', { kind: 'evil' })], index: 0 }),
    ],
    [
      'a bad scroll position',
      JSON.stringify({ entries: [{ ...entry('1'), scrollY: -5 }], index: 0 }),
    ],
    [
      'a version id that could change the frame URL',
      JSON.stringify({
        entries: [
          entry('1', {
            kind: 'site',
            address: 'a.zz',
            versionId: '../../evil',
            title: 'A',
            authorName: 'B',
          }),
        ],
        index: 0,
      }),
    ],
  ])('rejects %s', (_name, raw) => {
    expect(parseStoredTrail(raw)).toBeNull();
  });
});
