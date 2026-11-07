import { z } from 'zod';
import { objectIdSchema } from './site.js';

/** How a person arrived at an address. Moving back or forward is not an arrival. */
export const visitViaSchema = z.enum([
  'typed',
  'link',
  'search',
  'history',
  'publish',
  'direct',
]);

export type VisitVia = z.infer<typeof visitViaSchema>;

export const VISIT_VIAS = visitViaSchema.options;

/**
 * Names one navigation. Sending the same one twice records one visit, so a retry or
 * a repeated render can never count an arrival twice.
 */
export const entryIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid entry id');

/** What the browser reports when a page has been shown. The server sets the time. */
export const recordVisitSchema = z.strictObject({
  personId: objectIdSchema,
  address: z.string().trim().min(1).max(2048),
  /** The exact version shown, or null when the address led nowhere. */
  versionId: objectIdSchema.nullable(),
  via: visitViaSchema,
});

export type RecordVisit = z.infer<typeof recordVisitSchema>;

export const visitSchema = z.object({
  id: objectIdSchema,
  entryId: z.string(),
  address: z.string(),
  /** The title of the version that was seen, or null when it led nowhere. */
  title: z.string().nullable(),
  found: z.boolean(),
  via: visitViaSchema,
  visitedAt: z.iso.datetime(),
});

export type Visit = z.infer<typeof visitSchema>;

export const visitPageQuerySchema = z.object({
  /** Opaque: pass back the `nextCursor` from the previous page. */
  before: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export type VisitPageQuery = z.infer<typeof visitPageQuerySchema>;

/** One page of a person's history, newest first. */
export const visitPageSchema = z.object({
  visits: z.array(visitSchema),
  nextCursor: z.string().nullable(),
});

export type VisitPage = z.infer<typeof visitPageSchema>;
