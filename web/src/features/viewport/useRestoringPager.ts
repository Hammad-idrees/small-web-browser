'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Page<Item, Cursor> {
  readonly items: readonly Item[];
  /** Where the next page starts, or null when there is nothing more. */
  readonly next: Cursor | null;
}

export type PagerState = 'loading' | 'idle' | 'error';

interface Options<Item, Cursor> {
  /** Fetches one page, starting at `cursor`, or at the start when it is null. */
  readonly fetchPage: (cursor: Cursor | null) => Promise<Page<Item, Cursor>>;
  /** Where the list was scrolled to when it was left. */
  readonly initialScroll: number;
  readonly onScroll: (y: number) => void;
  /** When false, nothing is fetched at all. */
  readonly enabled?: boolean;
}

const SCROLL_REPORT_MS = 100;

/**
 * A scrolling list that loads a page at a time, and that comes back to where it was
 * left. On return it loads as many pages as it takes for the old position to exist,
 * then scrolls there, so a list read deep into its fourth page is restored exactly.
 *
 * Each list gets a fresh instance per trail entry, by giving its component a `key`.
 */
export function useRestoringPager<Item, Cursor>({
  fetchPage,
  initialScroll,
  onScroll,
  enabled = true,
}: Options<Item, Cursor>) {
  const pane = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [complete, setComplete] = useState(!enabled);
  const [state, setState] = useState<PagerState>(enabled ? 'loading' : 'idle');
  const [restoreTo] = useState(initialScroll);

  const loading = useRef(false);
  const restored = useRef(restoreTo === 0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetcher = useRef(fetchPage);
  useEffect(() => {
    fetcher.current = fetchPage;
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading.current || complete) return;
    loading.current = true;
    setState('loading');

    fetcher
      .current(cursor)
      .then((page) => {
        setItems((shown) => [...shown, ...page.items]);
        setCursor(page.next);
        setComplete(page.next === null);
        setState('idle');
      })
      .catch(() => {
        setState('error');
      })
      .finally(() => {
        loading.current = false;
      });
  }, [cursor, complete]);

  // The first page.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !enabled) return;
    started.current = true;
    loadMore();
  }, [enabled, loadMore]);

  // Returning: keep loading until the old position exists, then go there.
  useEffect(() => {
    const element = pane.current;
    if (restored.current || !element || state !== 'idle') return;

    const reachable = element.scrollHeight >= restoreTo + element.clientHeight;
    if (reachable || complete) {
      element.scrollTop = restoreTo;
      restored.current = true;
    } else {
      loadMore();
    }
  }, [items, state, complete, restoreTo, loadMore]);

  // Scrolling near the end loads the next page.
  useEffect(() => {
    const element = pane.current;
    const end = sentinel.current;
    if (!element || !end || complete) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && restored.current) {
          loadMore();
        }
      },
      { root: element, rootMargin: '600px 0px' },
    );
    observer.observe(end);
    return () => {
      observer.disconnect();
    };
  }, [complete, loadMore]);

  useEffect(
    () => () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    },
    [],
  );

  const handleScroll = useCallback(() => {
    if (!restored.current || scrollTimer.current !== null) return;
    scrollTimer.current = setTimeout(() => {
      scrollTimer.current = null;
      if (pane.current) onScroll(Math.round(pane.current.scrollTop));
    }, SCROLL_REPORT_MS);
  }, [onScroll]);

  return {
    pane,
    sentinel,
    items,
    state,
    complete,
    loadMore,
    handleScroll,
  };
}
