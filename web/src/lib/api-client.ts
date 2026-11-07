import {
  type ApiError,
  apiErrorSchema,
  type PageSource,
  pageSourceSchema,
  type Person,
  personSchema,
  type Publish,
  type PublishResult,
  publishResultSchema,
  type RecordVisit,
  type SearchPage,
  searchPageSchema,
  type SiteSummary,
  siteSummarySchema,
  type VisitPage,
  visitPageSchema,
} from '@small-web/contracts';
import { z } from 'zod';
import { env } from './env';

const API_URL = env.NEXT_PUBLIC_API_URL;

/** A response the API refused, with the reason it gave when there is one. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError | null,
  ) {
    super(body?.message ?? `Request failed with ${status}`);
  }
}

async function refusal(response: Response): Promise<ApiRequestError> {
  const parsed = apiErrorSchema.safeParse(
    await response.json().catch(() => null),
  );
  return new ApiRequestError(
    response.status,
    parsed.success ? parsed.data : null,
  );
}

export async function listPeople(): Promise<Person[]> {
  const response = await fetch(`${API_URL}/api/people`);
  if (!response.ok) throw new Error(`People: ${response.status}`);
  return z.array(personSchema).parse(await response.json());
}

/** Says what lives at an address, or null when nothing does. Rejects if the API fails. */
export async function resolveAddress(
  address: string,
  signal: AbortSignal,
): Promise<SiteSummary | null> {
  const response = await fetch(
    `${API_URL}/api/sites/${encodeURIComponent(address)}`,
    { signal },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Resolve: ${response.status}`);
  return siteSummarySchema.parse(await response.json());
}

const RECORD_ATTEMPTS = 3;

/**
 * Writes a visit to the person's history. The entry id makes repeating it harmless,
 * so a failed attempt is simply tried again a couple of times.
 */
export async function recordVisit(
  entryId: string,
  visit: RecordVisit,
): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(
        `${API_URL}/api/visits/${encodeURIComponent(entryId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visit),
          keepalive: true,
        },
      );
      // A 4xx will not get better by asking again.
      if (response.ok || response.status < 500) return;
    } catch {
      // The network failed. Try again below.
    }
    if (attempt >= RECORD_ATTEMPTS) throw new Error('Could not record visit');
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }
}

/** One page of a person's history, newest first. */
export async function listVisits(
  personId: string,
  before: string | null,
): Promise<VisitPage> {
  const query = new URLSearchParams({ limit: '30' });
  if (before) query.set('before', before);
  const response = await fetch(
    `${API_URL}/api/people/${personId}/visits?${query.toString()}`,
  );
  if (!response.ok) throw new Error(`History: ${response.status}`);
  return visitPageSchema.parse(await response.json());
}

/** Pages that mention the query, best first. */
export async function searchSites(
  query: string,
  offset: number,
): Promise<SearchPage> {
  const params = new URLSearchParams({
    q: query,
    offset: String(offset),
    limit: '20',
  });
  const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Search: ${response.status}`);
  return searchPageSchema.parse(await response.json());
}

/** Publishes a page. Rejects with an ApiRequestError saying why, when refused. */
export async function publishPage(page: Publish): Promise<PublishResult> {
  const response = await fetch(`${API_URL}/api/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(page),
  });
  if (!response.ok) throw await refusal(response);
  return publishResultSchema.parse(await response.json());
}

/** A version as its author wrote it, for editing. It is shown as text, never rendered. */
export async function getPageSource(versionId: string): Promise<PageSource> {
  const response = await fetch(`${API_URL}/api/versions/${versionId}/source`);
  if (!response.ok) throw await refusal(response);
  return pageSourceSchema.parse(await response.json());
}

/** Where a contained page is served from. */
export function versionUrl(versionId: string): string {
  return `${API_URL}/render/versions/${versionId}`;
}
