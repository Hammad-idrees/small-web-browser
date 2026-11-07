import { z } from 'zod';

export const MAX_SEARCH_QUERY = 200;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(MAX_SEARCH_QUERY),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** A stretch of a snippet that matched the query, by character position. */
export const highlightSchema = z.object({
  start: z.number().int().min(0),
  length: z.number().int().min(1),
});

export type Highlight = z.infer<typeof highlightSchema>;

export const searchResultSchema = z.object({
  address: z.string(),
  title: z.string(),
  authorName: z.string(),
  /** A few lines of the page around where it matched, as plain text. */
  snippet: z.string(),
  highlights: z.array(highlightSchema),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

/** One page of results, best first. */
export const searchPageSchema = z.object({
  results: z.array(searchResultSchema),
  nextOffset: z.number().int().nullable(),
});

export type SearchPage = z.infer<typeof searchPageSchema>;
