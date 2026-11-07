import { Types } from 'mongoose';
import { decodeVisitCursor, encodeVisitCursor } from './visit-cursor.js';

describe('visit cursor', () => {
  it('round-trips a position', () => {
    const cursor = {
      visitedAt: new Date('2026-11-01T09:21:03.000Z'),
      id: new Types.ObjectId('0123456789abcdef01234567'),
    };
    const decoded = decodeVisitCursor(encodeVisitCursor(cursor));
    expect(decoded?.visitedAt.toISOString()).toBe(
      cursor.visitedAt.toISOString(),
    );
    expect(decoded?.id.equals(cursor.id)).toBe(true);
  });

  it.each([
    [''],
    ['nonsense'],
    ['123_short'],
    ['123_0123456789ABCDEF01234567'],
    ['-1_0123456789abcdef01234567'],
    ['1.5_0123456789abcdef01234567'],
    ['9999999999999999_0123456789abcdef01234567'],
    ['123_0123456789abcdef01234567_extra'],
  ])('rejects %j', (raw) => {
    expect(decodeVisitCursor(raw)).toBeNull();
  });
});
