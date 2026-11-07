'use client';

import type { Person } from '@small-web/contracts';
import type { Route } from '../navigation/route-codec';
import type { TrailLocation } from '../navigation/trail';
import { AddressBar } from './AddressBar';
import {
  BackIcon,
  ForwardIcon,
  HistoryIcon,
  LogoMark,
  PublishIcon,
} from './icons';
import { PersonPicker } from './PersonPicker';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  readonly addressText: string;
  readonly location: TrailLocation | undefined;
  readonly loading: boolean;
  readonly ready: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly people: readonly Person[];
  readonly personId: string | null;
  readonly onBack: () => void;
  readonly onForward: () => void;
  readonly onNavigate: (route: Route) => void;
  readonly onPersonChange: (personId: string) => void;
  readonly onEdit?: () => void;
}

export function Toolbar({
  addressText,
  location,
  loading,
  ready,
  canGoBack,
  canGoForward,
  people,
  personId,
  onBack,
  onForward,
  onNavigate,
  onPersonChange,
  onEdit,
}: ToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.navGroup}>
        <button
          type="button"
          className={styles.logo}
          aria-label="Start page"
          title="Start page"
          disabled={!ready}
          onClick={() => {
            onNavigate({ kind: 'home' });
          }}
        >
          <span className={styles.logoMark}>
            <LogoMark />
          </span>
          <span className={styles.wordmark} aria-hidden="true">
            Small Web
          </span>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Back"
          title="Back"
          disabled={!canGoBack}
          onClick={onBack}
        >
          <BackIcon />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Forward"
          title="Forward"
          disabled={!canGoForward}
          onClick={onForward}
        >
          <ForwardIcon />
        </button>
      </div>

      <AddressBar
        key={addressText}
        text={addressText}
        location={location}
        disabled={!ready}
        onSubmit={onNavigate}
        onEdit={onEdit}
      />

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.pill}
          aria-label="History"
          title="History"
          aria-current={location?.kind === 'history' ? 'page' : undefined}
          disabled={!ready}
          onClick={() => {
            onNavigate({ kind: 'history' });
          }}
        >
          <HistoryIcon />
          <span className={styles.pillText}>History</span>
        </button>

        <button
          type="button"
          className={`${styles.pill} ${styles.pillNeon}`}
          aria-label="Publish"
          title="Publish a page"
          aria-current={location?.kind === 'publish' ? 'page' : undefined}
          disabled={!ready}
          onClick={() => {
            onNavigate({ kind: 'publish' });
          }}
        >
          <PublishIcon />
          <span className={styles.pillText}>Publish</span>
        </button>
      </div>

      <PersonPicker
        people={people}
        personId={personId}
        onChange={onPersonChange}
      />

      <div
        className={`${styles.progress} ${loading ? styles.progressActive : ''}`}
        role={loading ? 'progressbar' : undefined}
        aria-label={loading ? 'Loading' : undefined}
      />
    </header>
  );
}
