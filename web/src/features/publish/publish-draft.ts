import { z } from 'zod';

const STORAGE_KEY = 'small-web:publish-draft';

const draftSchema = z.object({
  address: z.string(),
  title: z.string(),
  html: z.string(),
  authorId: z.string().optional(),
});

export type PublishDraft = z.infer<typeof draftSchema>;

/**
 * An unsent page, kept for this tab. Leaving the publish page and coming back, by
 * Back, Forward or a refresh, finds the draft as it was left.
 */
export function loadDraft(): PublishDraft | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const result = draftSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: PublishDraft): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Without storage, a draft only lasts while the page is open.
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
