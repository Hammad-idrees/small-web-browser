'use client';

import type { Visit, VisitVia } from '@small-web/contracts';
import { useCallback } from 'react';
import { listVisits } from '@/lib/api-client';
import { useRestoringPager } from '../viewport/useRestoringPager';
import styles from './HistoryPage.module.css';

const VIA_LABELS: Record<VisitVia, string> = {
  typed: 'Typed',
  link: 'Followed a link',
  search: 'From search',
  history: 'From history',
  publish: 'Published',
  direct: 'Opened directly',
};

interface HistoryPageProps {
  readonly personId: string;
  readonly personName: string | undefined;
  /** Where this page was scrolled to when it was left. */
  readonly scrollY: number;
  readonly onScroll: (y: number) => void;
  readonly onOpen: (address: string) => void;
}

/** Everywhere one person has been, newest first, a page at a time. */
export function HistoryPage({
  personId,
  personName,
  scrollY,
  onScroll,
  onOpen,
}: HistoryPageProps) {
  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const page = await listVisits(personId, cursor);
      return { items: page.visits, next: page.nextCursor };
    },
    [personId],
  );

  const { pane, sentinel, items, state, complete, loadMore, handleScroll } =
    useRestoringPager<Visit, string>({
      fetchPage,
      initialScroll: scrollY,
      onScroll,
    });

  const days = groupByDay(items);

  return (
    <div className={styles.pane} ref={pane} onScroll={handleScroll}>
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

        {days.map(({ label, visits }) => (
          <section key={label} className={styles.day}>
            <h2 className={styles.dayLabel}>{label}</h2>
            <ol className={styles.list}>
              {visits.map((visit) => (
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
          ) : complete && items.length === 0 ? (
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
