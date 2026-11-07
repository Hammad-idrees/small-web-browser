import { Types } from 'mongoose';

/**
 * A position in a person's history: the time of a visit, and its id to break ties.
 * Paging by position, not by count, means visits added while someone is scrolling
 * can never shift a page and make an entry appear twice or not at all.
 */
export interface VisitCursor {
  readonly visitedAt: Date;
  readonly id: Types.ObjectId;
}

const CURSOR_SHAPE = /^(\d{1,15})_([0-9a-f]{24})$/;

export function encodeVisitCursor(cursor: VisitCursor): string {
  return `${cursor.visitedAt.getTime()}_${cursor.id.toHexString()}`;
}

/** Returns null for anything that is not a cursor this API gave out. */
export function decodeVisitCursor(raw: string): VisitCursor | null {
  const match = CURSOR_SHAPE.exec(raw);
  if (!match?.[1] || !match[2]) return null;
  const time = Number(match[1]);
  if (!Number.isSafeInteger(time)) return null;
  return { visitedAt: new Date(time), id: new Types.ObjectId(match[2]) };
}
