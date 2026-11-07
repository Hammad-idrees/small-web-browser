import { objectIdSchema } from '@small-web/contracts';
import { z } from 'zod';
import type { NavigatorEnvironment } from './navigator';
import type { Trail } from './trail';

const STORAGE_KEY = 'small-web:trail';

const locationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('home') }),
  z.object({ kind: z.literal('history') }),
  z.object({ kind: z.literal('publish') }),
  z.object({ kind: z.literal('search'), query: z.string() }),
  z.object({ kind: z.literal('nowhere'), address: z.string() }),
  z.object({
    kind: z.literal('site'),
    address: z.string(),
    versionId: objectIdSchema,
    title: z.string(),
    authorName: z.string(),
  }),
]);

const storedTrailSchema = z
  .object({
    entries: z.array(
      z.object({
        id: z.string().min(1),
        ownerId: z.string().min(1),
        location: locationSchema,
        scrollY: z.number().finite().min(0),
      }),
    ),
    index: z.number().int().min(0),
  })
  .refine((trail) => trail.index < trail.entries.length);

/** Parses a stored trail, returning null for anything missing, old or tampered with. */
export function parseStoredTrail(raw: string | null): Trail | null {
  if (raw === null) return null;
  try {
    const result = storedTrailSchema.safeParse(JSON.parse(raw));
    return result.success ? { ...result.data, pending: null } : null;
  } catch {
    return null;
  }
}

/**
 * Keeps the trail for the life of this tab, so a refresh loses nothing. A request in
 * flight is not kept. Storage can be unavailable, and the trail then lasts until the
 * page is reloaded.
 */
export const trailStorage: NavigatorEnvironment['storage'] = {
  load: () => {
    try {
      return parseStoredTrail(window.sessionStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  },

  save: (trail) => {
    try {
      const { entries, index } = trail;
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ entries, index }),
      );
    } catch {
      // Full or blocked storage only costs the ability to survive a refresh.
    }
  },
};
