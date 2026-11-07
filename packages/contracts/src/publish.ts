import { z } from 'zod';
import { normalizeAddress } from './address.js';
import { objectIdSchema } from './site.js';

/** Every address in this web ends here. Nobody can publish as `bank.com`. */
export const PUBLISHABLE_SUFFIX = '.zz';

export const MAX_TITLE = 120;
export const MAX_PAGE_HTML = 200_000;

/** The canonical address to publish at, or null if nobody may publish there. */
export function publishableAddress(input: string): string | null {
  const address = normalizeAddress(input);
  return address?.endsWith(PUBLISHABLE_SUFFIX) ? address : null;
}

export const publishSchema = z.strictObject({
  address: z
    .string()
    .trim()
    .max(253)
    .refine((value) => publishableAddress(value) !== null, {
      message: `Must be an address ending in ${PUBLISHABLE_SUFFIX}, like yourname${PUBLISHABLE_SUFFIX}`,
    }),
  title: z
    .string()
    .trim()
    .min(1, { message: 'Give the page a title' })
    .max(MAX_TITLE, {
      message: `Keep the title under ${String(MAX_TITLE)} characters`,
    }),
  html: z
    .string()
    .trim()
    .min(1, { message: 'Write something for the page' })
    .max(MAX_PAGE_HTML, { message: 'That page is too long to publish' }),
  authorId: objectIdSchema,
});

export type Publish = z.infer<typeof publishSchema>;

export const publishResultSchema = z.object({
  address: z.string(),
  versionId: objectIdSchema,
  versionNumber: z.number().int().min(1),
  /** True when this made a new site; false when it added a version to one. */
  created: z.boolean(),
});

export type PublishResult = z.infer<typeof publishResultSchema>;

/** A page's source exactly as its author wrote it. It is text to edit, never to render. */
export const pageSourceSchema = z.object({
  address: z.string(),
  title: z.string(),
  html: z.string(),
  authorId: objectIdSchema,
});

export type PageSource = z.infer<typeof pageSourceSchema>;
