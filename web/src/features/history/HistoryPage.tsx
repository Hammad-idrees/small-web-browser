'use client';

import type { Visit, VisitVia } from '@small-web/contracts';
import { type ReactNode, useCallback } from 'react';
import { Button } from '@/components/Button';
import { PageBanner } from '@/components/PageBanner';
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
  readonly onHome: () => void;
}

/** Everywhere one person has been, newest first, a page at a time. */
export function HistoryPage({
  personId,
  personName,
  scrollY,
  onScroll,
  onOpen,
  onHome,
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
      <PageBanner
        title="History"
        subtitle={personName ? `${personName}’s trail` : 'Your trail'}
        crumb="History"
        onHome={onHome}
      />

      <div className={styles.body}>
        <div className={styles.inner}>
          <div className={styles.intro}>
            <p className={styles.lede}>
              Every arrival, newest first. Going back and forward is not an
              arrival, so it is not written down.
            </p>
            <ul className={styles.legend} aria-label="Key">
              <li>
                <span className={styles.markerFound} aria-hidden="true" />
                Found a page
              </li>
              <li>
                <span className={styles.markerDead} aria-hidden="true" />
                Led nowhere
              </li>
            </ul>
          </div>

          {days.map(({ label, visits }) => (
            <section key={label} className={styles.day}>
              <div className={styles.dayHead}>
                <h2 className={styles.dayLabel}>{label}</h2>
                <span className={styles.dayCount}>
                  {visits.length} {visits.length === 1 ? 'visit' : 'visits'}
                </span>
              </div>

              <ol className={styles.timeline}>
                {visits.map((visit) => (
                  <li key={visit.id} className={styles.entry}>
                    <time className={styles.time} dateTime={visit.visitedAt}>
                      {formatTime(visit.visitedAt)}
                    </time>
                    <span
                      className={
                        visit.found ? styles.markerFound : styles.markerDead
                      }
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      className={`${styles.card} ${visit.found ? '' : styles.cardDead}`}
                      onClick={() => {
                        onOpen(visit.address);
                      }}
                    >
                      <span className={styles.what}>
                        <span className={styles.cardTitle}>
                          {visit.title ?? 'Nowhere'}
                        </span>
                        <span className={styles.address}>{visit.address}</span>
                      </span>
                      <span className={styles.via}>
                        {VIA_ICONS[visit.via]}
                        {VIA_LABELS[visit.via]}
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
            </section>
          ))}

          <div ref={sentinel} />

          <footer className={styles.footer} aria-live="polite">
            {state === 'loading' ? (
              <span className={styles.loading}>
                <span className={styles.spinner} aria-hidden="true" />
                Loading…
              </span>
            ) : state === 'error' ? (
              <>
                <span>Could not load the history.</span>
                <Button variant="outline" size="sm" onClick={loadMore}>
                  Try again
                </Button>
              </>
            ) : complete && items.length === 0 ? (
              <span className={styles.empty}>
                Nothing here yet. Everywhere {personName ?? 'you'} goes will be
                written down here.
              </span>
            ) : complete ? (
              <span className={styles.end}>That is everywhere.</span>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}

function ViaIcon({ children }: { readonly children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** A small picture of how each arrival happened. */
const VIA_ICONS: Record<VisitVia, ReactNode> = {
  typed: (
    <ViaIcon>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" />
    </ViaIcon>
  ),
  link: (
    <ViaIcon>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </ViaIcon>
  ),
  search: (
    <ViaIcon>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </ViaIcon>
  ),
  history: (
    <ViaIcon>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3.5 4.5V9h4.5M12 7.5V12l3 2" />
    </ViaIcon>
  ),
  publish: (
    <ViaIcon>
      <path d="M12 20h8" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </ViaIcon>
  ),
  direct: (
    <ViaIcon>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </ViaIcon>
  ),
};

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
