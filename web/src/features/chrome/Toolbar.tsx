'use client';

import type { Person } from '@small-web/contracts';
import type { Route } from '../navigation/route-codec';
import type { TrailLocation } from '../navigation/trail';
import { AddressBar } from './AddressBar';
import { BackIcon, ForwardIcon, HistoryIcon, LogoMark } from './icons';
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
          <LogoMark />
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
      />

      <button
        type="button"
        className={styles.iconButton}
        aria-label="History"
        title="History"
        aria-current={location?.kind === 'history' ? 'page' : undefined}
        disabled={!ready}
        onClick={() => {
          onNavigate({ kind: 'history' });
        }}
      >
        <HistoryIcon />
      </button>

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
