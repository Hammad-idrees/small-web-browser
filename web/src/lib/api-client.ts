import {
  type Person,
  personSchema,
  type SiteSummary,
  siteSummarySchema,
} from '@small-web/contracts';
import { z } from 'zod';
import { env } from './env';

const API_URL = env.NEXT_PUBLIC_API_URL;

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

/** Where a contained page is served from. */
export function versionUrl(versionId: string): string {
  return `${API_URL}/render/versions/${versionId}`;
}
