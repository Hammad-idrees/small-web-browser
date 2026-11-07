'use client';

import {
  type Highlight,
  MAX_SEARCH_QUERY,
  type SearchResult,
} from '@small-web/contracts';
import { type ReactNode, type SubmitEvent, useCallback } from 'react';
import { searchSites } from '@/lib/api-client';
import { useRestoringPager } from '../viewport/useRestoringPager';
import styles from './SearchPage.module.css';

interface SearchPageProps {
  readonly query: string;
  /** Where the results were scrolled to when they were left. */
  readonly scrollY: number;
  readonly onScroll: (y: number) => void;
  readonly onOpen: (address: string) => void;
  readonly onSearch: (query: string) => void;
}

/**
 * Results for one search. It has an address of its own, `/search?q=…`, so it is a
 * real step on the trail: going back to it shows the same results, scrolled to where
 * they were left.
 */
export function SearchPage({
  query,
  scrollY,
  onScroll,
  onOpen,
  onSearch,
}: SearchPageProps) {
  const hasQuery = query.trim() !== '';

  const fetchPage = useCallback(
    async (offset: number | null) => {
      const page = await searchSites(query, offset ?? 0);
      return { items: page.results, next: page.nextOffset };
    },
    [query],
  );

  const { pane, sentinel, items, state, complete, loadMore, handleScroll } =
    useRestoringPager<SearchResult, number>({
      fetchPage,
      initialScroll: scrollY,
      onScroll,
      enabled: hasQuery,
    });

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    if (typeof value === 'string' && value.trim() !== '')
      onSearch(value.trim());
  };

  return (
    <div className={styles.pane} ref={pane} onScroll={handleScroll}>
      <div className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Search</p>
          <h1 className={styles.title}>
            {hasQuery ? (
              <>
                Pages that mention <span className={styles.query}>{query}</span>
              </>
            ) : (
              'Search the small web'
            )}
          </h1>
          <form className={styles.form} role="search" onSubmit={submit}>
            <input
              className={styles.input}
              name="q"
              defaultValue={query}
              aria-label="Search for"
              placeholder="Words you remember from a page"
              maxLength={MAX_SEARCH_QUERY}
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="submit" className={styles.submit}>
              Search
            </button>
          </form>
        </header>

        <ol className={styles.results}>
          {items.map((result) => (
            <li key={result.address}>
              <button
                type="button"
                className={styles.result}
                onClick={() => {
                  onOpen(result.address);
                }}
              >
                <span className={styles.meta}>
                  <span className={styles.address}>{result.address}</span>
                  <span className={styles.author}>by {result.authorName}</span>
                </span>
                <span className={styles.resultTitle}>{result.title}</span>
                <span className={styles.snippet}>
                  {withHighlights(result.snippet, result.highlights)}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div ref={sentinel} />

        <footer className={styles.footer} aria-live="polite">
          {!hasQuery ? (
            <span>
              Search looks through the words on every page, not just the titles.
            </span>
          ) : state === 'loading' ? (
            <span>Searching…</span>
          ) : state === 'error' ? (
            <>
              <span>The search could not be finished.</span>
              <button type="button" className={styles.retry} onClick={loadMore}>
                Try again
              </button>
            </>
          ) : complete && items.length === 0 ? (
            <span>
              No page mentions that. Try fewer words, or another way of putting
              it.
            </span>
          ) : complete ? (
            <span>
              {items.length === 1 ? 'One page' : `${items.length} pages`} found.
            </span>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

/** Marks the matching words. The snippet is plain text, so nothing here is HTML. */
function withHighlights(
  snippet: string,
  highlights: readonly Highlight[],
): ReactNode[] {
  const parts: ReactNode[] = [];
  let position = 0;
  for (const { start, length } of highlights) {
    if (start < position || start + length > snippet.length) continue;
    if (start > position) parts.push(snippet.slice(position, start));
    parts.push(
      <mark key={start} className={styles.mark}>
        {snippet.slice(start, start + length)}
      </mark>,
    );
    position = start + length;
  }
  parts.push(snippet.slice(position));
  return parts;
}
