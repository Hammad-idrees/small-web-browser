'use client';

import { normalizeAddress, type VisitVia } from '@small-web/contracts';
import { useCallback } from 'react';
import { HistoryPage } from '../history/HistoryPage';
import { SearchPage } from '../search/SearchPage';
import type { Navigator } from '../navigation/navigator';
import type { TrailEntry } from '../navigation/trail';
import { HomePage } from './HomePage';
import { NowherePage } from './NowherePage';
import { SiteFrame } from './SiteFrame';
import { NotBuiltPage } from './StatusPages';

interface ViewportProps {
  readonly entry: TrailEntry;
  readonly navigator: Navigator;
  readonly personId: string;
  readonly personName: string | undefined;
  readonly canGoBack: boolean;
}

/** Shows whatever the current trail entry is. */
export function Viewport({
  entry,
  navigator,
  personId,
  personName,
  canGoBack,
}: ViewportProps) {
  const entryId = entry.id;

  const open = useCallback(
    (address: string, via: VisitVia) => {
      navigator.navigate({ kind: 'address', address }, via);
    },
    [navigator],
  );

  // An href is whatever an author wrote. If it is not an address, it leads nowhere.
  const followLink = useCallback(
    (href: string) => {
      const address = normalizeAddress(href) ?? href.trim();
      if (address !== '') open(address, 'link');
    },
    [open],
  );

  const openFromStartPage = useCallback(
    (address: string) => {
      open(address, 'link');
    },
    [open],
  );

  const openFromSearch = useCallback(
    (address: string) => {
      open(address, 'search');
    },
    [open],
  );

  const search = useCallback(
    (query: string) => {
      navigator.navigate({ kind: 'search', query });
    },
    [navigator],
  );

  const openFromHistory = useCallback(
    (address: string) => {
      open(address, 'history');
    },
    [open],
  );

  const reportScroll = useCallback(
    (y: number) => {
      navigator.reportScroll(entryId, y);
    },
    [navigator, entryId],
  );

  const { location } = entry;

  switch (location.kind) {
    case 'site':
      return (
        <SiteFrame
          key={entry.id}
          versionId={location.versionId}
          title={location.title}
          scrollY={entry.scrollY}
          onNavigate={followLink}
          onScroll={reportScroll}
        />
      );
    case 'nowhere':
      return (
        <NowherePage
          address={location.address}
          canGoBack={canGoBack}
          onBack={navigator.goBack}
          onHome={() => {
            navigator.navigate({ kind: 'home' });
          }}
        />
      );
    case 'home':
      return <HomePage personName={personName} onOpen={openFromStartPage} />;
    case 'search':
      return (
        <SearchPage
          key={entry.id}
          query={location.query}
          scrollY={entry.scrollY}
          onScroll={reportScroll}
          onOpen={openFromSearch}
          onSearch={search}
        />
      );
    case 'history':
      return (
        <HistoryPage
          key={entry.id}
          personId={personId}
          personName={personName}
          scrollY={entry.scrollY}
          onScroll={reportScroll}
          onOpen={openFromHistory}
        />
      );
    case 'publish':
      return <NotBuiltPage name="Publish" />;
  }
}
