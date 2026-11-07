'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { listPeople, recordVisit, resolveAddress } from '@/lib/api-client';
import { browserHistory } from './browser-history';
import { Navigator } from './navigator';
import { trailStorage } from './trail-storage';

function createNavigator(): Navigator {
  return new Navigator({
    history: browserHistory,
    storage: trailStorage,
    api: { listPeople, resolveAddress, recordVisit },
    createId: () => crypto.randomUUID(),
  });
}

/** Gives a component the navigator, and re-renders it whenever the state changes. */
export function useNavigator() {
  const [navigator] = useState(createNavigator);
  const snapshot = useSyncExternalStore(
    navigator.subscribe,
    navigator.getSnapshot,
    navigator.getSnapshot,
  );

  useEffect(() => navigator.connect(), [navigator]);

  return { navigator, snapshot };
}
