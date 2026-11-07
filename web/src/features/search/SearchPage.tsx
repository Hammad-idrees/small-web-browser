'use client';

import {
  type Highlight,
  MAX_SEARCH_QUERY,
  type SearchResult,
} from '@small-web/contracts';
import { type ReactNode, type SubmitEvent, useCallback } from 'react';
import { Button } from '@/components/Button';
import { PageBanner } from '@/components/PageBanner';
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
  readonly onHome: () => void;
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
  onHome,
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
      <PageBanner
        title="Search"
        subtitle={hasQuery ? `“${query}”` : 'Every word on every page'}
        crumb="Search"
        onHome={onHome}
      />

      <div className={styles.page}>
        <form className={styles.form} role="search" onSubmit={submit}>
          <span className={styles.formIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m20 20-4-4" />
            </svg>
          </span>
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
          <Button type="submit" variant="solid" className={styles.submit}>
            Search
          </Button>
        </form>
        <p className={styles.hint}>
          Search reads the words on every page, not just the titles.
        </p>

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
                <span className={styles.resultBody}>
                  <span className={styles.meta}>
                    <span className={styles.address}>{result.address}</span>
                    <span className={styles.author}>
                      by {result.authorName}
                    </span>
                  </span>
                  <span className={styles.resultTitle}>{result.title}</span>
                  <span className={styles.snippet}>
                    {withHighlights(result.snippet, result.highlights)}
                  </span>
                </span>
                <span className={styles.go} aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div ref={sentinel} />

        <footer className={styles.footer} aria-live="polite">
          {!hasQuery ? null : state === 'loading' ? (
            <span className={styles.loading}>
              <span className={styles.spinner} aria-hidden="true" />
              Searching…
            </span>
          ) : state === 'error' ? (
            <>
              <span>The search could not be finished.</span>
              <Button variant="outline" size="sm" onClick={loadMore}>
                Try again
              </Button>
            </>
          ) : complete && items.length === 0 ? (
            <span className={styles.empty}>
              No page mentions that. Try fewer words, or another way of putting
              it.
            </span>
          ) : complete ? (
            <span className={styles.end}>
              {items.length === 1
                ? 'One page'
                : `${String(items.length)} pages`}{' '}
              found
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
