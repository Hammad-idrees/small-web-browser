import { z } from 'zod';

/** A MongoDB document id, as it appears in a URL. */
export const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/, 'Invalid id');

/** What an address resolves to. `versionId` pins exactly which page was shown. */
export const siteSummarySchema = z.object({
  address: z.string(),
  title: z.string(),
  authorName: z.string(),
  versionId: objectIdSchema,
});

export type SiteSummary = z.infer<typeof siteSummarySchema>;
