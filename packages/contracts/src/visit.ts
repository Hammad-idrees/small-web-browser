import { z } from 'zod';

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
