'use client';

import type { Visit, VisitVia } from '@small-web/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { listVisits } from '@/lib/api-client';
import styles from './HistoryPage.module.css';

const VIA_LABELS: Record<VisitVia, string> = {
  typed: 'Typed',
  link: 'Followed a link',
  search: 'From search',
  history: 'From history',
  publish: 'Published',
  direct: 'Opened directly',
};

const SCROLL_REPORT_MS = 100;

interface HistoryPageProps {
  readonly personId: string;
  readonly personName: string | undefined;
  /** Where this page was scrolled to when it was left. */
  readonly scrollY: number;
  readonly onScroll: (y: number) => void;
  readonly onOpen: (address: string) => void;
}

type LoadState = 'loading' | 'idle' | 'error';

/**
 * Everywhere one person has been, newest first, loaded a page at a time as they
 * scroll. Returning here puts the list back where it was left, loading as many pages
 * as it takes to get there.
 */
export function HistoryPage({
  personId,
  personName,
  scrollY,
  onScroll,
  onOpen,
}: HistoryPageProps) {
  const pane = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [state, setState] = useState<LoadState>('loading');
  const [initialScroll] = useState(scrollY);

  const loading = useRef(false);
  const restored = useRef(initialScroll === 0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMore = useCallback(() => {
    if (loading.current || complete) return;
    loading.current = true;
    setState('loading');

    listVisits(personId, cursor)
      .then((page) => {
        setVisits((shown) => [...shown, ...page.visits]);
        setCursor(page.nextCursor);
        setComplete(page.nextCursor === null);
        setState('idle');
      })
      .catch(() => {
        setState('error');
      })
      .finally(() => {
        loading.current = false;
      });
  }, [personId, cursor, complete]);

  // The first page.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    loadMore();
  }, [loadMore]);

  // Returning: keep loading until the old position exists, then go there.
  useEffect(() => {
    const element = pane.current;
    if (restored.current || !element || state !== 'idle') return;

    const reachable =
      element.scrollHeight >= initialScroll + element.clientHeight;
    if (reachable || complete) {
      element.scrollTop = initialScroll;
      restored.current = true;
    } else {
      loadMore();
    }
  }, [visits, state, complete, initialScroll, loadMore]);

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

  const reportScroll = () => {
    if (!restored.current || scrollTimer.current !== null) return;
    scrollTimer.current = setTimeout(() => {
      scrollTimer.current = null;
      if (pane.current) onScroll(Math.round(pane.current.scrollTop));
    }, SCROLL_REPORT_MS);
  };

  const days = groupByDay(visits);

  return (
    <div className={styles.pane} ref={pane} onScroll={reportScroll}>
      <div className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>History</p>
          <h1 className={styles.title}>
            Where {personName ?? 'you'} {personName ? 'has' : 'have'} been
          </h1>
          <p className={styles.lede}>
            Every arrival, newest first. Going back and forward is not an
            arrival, so it is not written down.
          </p>
        </header>

        {days.map(({ label, visits: dayVisits }) => (
          <section key={label} className={styles.day}>
            <h2 className={styles.dayLabel}>{label}</h2>
            <ol className={styles.list}>
              {dayVisits.map((visit) => (
                <li key={visit.id}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => {
                      onOpen(visit.address);
                    }}
                  >
                    <time className={styles.time} dateTime={visit.visitedAt}>
                      {formatTime(visit.visitedAt)}
                    </time>
                    <span className={styles.what}>
                      <span
                        className={
                          visit.found ? styles.rowTitle : styles.rowTitleDead
                        }
                      >
                        {visit.title ?? 'Nowhere'}
                      </span>
                      <span className={styles.address}>{visit.address}</span>
                    </span>
                    <span className={styles.via}>{VIA_LABELS[visit.via]}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <div ref={sentinel} />

        <footer className={styles.footer} aria-live="polite">
          {state === 'loading' ? (
            <span>Loading…</span>
          ) : state === 'error' ? (
            <>
              <span>Could not load the history.</span>
              <button type="button" className={styles.retry} onClick={loadMore}>
                Try again
              </button>
            </>
          ) : complete && visits.length === 0 ? (
            <span>
              Nothing here yet. Everywhere {personName ?? 'you'} goes will be
              written down here.
            </span>
          ) : complete ? (
            <span>That is everywhere.</span>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function groupByDay(visits: readonly Visit[]) {
  const days: { label: string; visits: Visit[] }[] = [];
  for (const visit of visits) {
    const label = formatDay(visit.visitedAt);
    const last = days.at(-1);
    if (last?.label === label) last.visits.push(visit);
    else days.push({ label, visits: [visit] });
  }
  return days;
}

function formatDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
