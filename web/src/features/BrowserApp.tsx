'use client';

import { useEffect } from 'react';
import styles from './BrowserApp.module.css';
import { Toolbar } from './chrome/Toolbar';
import type { Route } from './navigation/route-codec';
import {
  currentEntry,
  entryAhead,
  entryBehind,
  type TrailLocation,
} from './navigation/trail';
import { useNavigator } from './navigation/useNavigator';
import { OfflinePage } from './viewport/StatusPages';
import { Viewport } from './viewport/Viewport';

/** What the address bar shows for somewhere that has been reached or asked for. */
function addressTextOf(place: Route | TrailLocation | undefined): string {
  switch (place?.kind) {
    case 'address':
    case 'site':
    case 'nowhere':
      return place.address;
    case 'search':
      return place.query;
    default:
      return '';
  }
}

function describe(route: Route): string {
  return route.kind === 'address' ? route.address : 'that page';
}

export function BrowserApp() {
  const { navigator, snapshot } = useNavigator();
  const { status, trail, people, personId, failure } = snapshot;

  const entry = currentEntry(trail);
  const location = entry?.location;
  const ready = status === 'ready';
  const person = people.find((candidate) => candidate.id === personId);

  useEffect(() => {
    document.title =
      location?.kind === 'site' ? `${location.title} · Small Web` : 'Small Web';
  }, [location]);

  return (
    <div className={styles.app}>
      <Toolbar
        addressText={addressTextOf(trail.pending?.route ?? location)}
        location={trail.pending ? undefined : location}
        loading={trail.pending !== null || status === 'booting'}
        ready={ready}
        canGoBack={entryBehind(trail) !== null}
        canGoForward={entryAhead(trail) !== null}
        people={people}
        personId={personId}
        onBack={navigator.goBack}
        onForward={navigator.goForward}
        onNavigate={navigator.navigate}
        onPersonChange={navigator.switchPerson}
      />

      {failure ? (
        <div className={styles.failure} role="alert">
          <span>
            Could not reach <strong>{describe(failure.route)}</strong>. You are
            still where you were.
          </span>
          <button
            type="button"
            className={styles.failureAction}
            onClick={navigator.retry}
          >
            Try again
          </button>
          <button
            type="button"
            className={styles.failureDismiss}
            onClick={navigator.dismissFailure}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <main className={styles.viewport} aria-busy={trail.pending !== null}>
        {status === 'offline' ? (
          <OfflinePage onRetry={navigator.retryBoot} />
        ) : entry ? (
          <Viewport
            entry={entry}
            navigator={navigator}
            personName={person?.name}
            canGoBack={entryBehind(trail) !== null}
          />
        ) : null}
      </main>
    </div>
  );
}
