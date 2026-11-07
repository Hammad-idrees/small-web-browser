'use client';

import { normalizeAddress } from '@small-web/contracts';
import { useCallback } from 'react';
import type { Navigator } from '../navigation/navigator';
import type { TrailEntry } from '../navigation/trail';
import { HomePage } from './HomePage';
import { NowherePage } from './NowherePage';
import { SiteFrame } from './SiteFrame';
import { NotBuiltPage } from './StatusPages';

interface ViewportProps {
  readonly entry: TrailEntry;
  readonly navigator: Navigator;
  readonly personName: string | undefined;
  readonly canGoBack: boolean;
}

/** Shows whatever the current trail entry is. */
export function Viewport({
  entry,
  navigator,
  personName,
  canGoBack,
}: ViewportProps) {
  const entryId = entry.id;

  const openAddress = useCallback(
    (address: string) => {
      navigator.navigate({ kind: 'address', address });
    },
    [navigator],
  );

  // An href is whatever an author wrote. If it is not an address, it leads nowhere.
  const followLink = useCallback(
    (href: string) => {
      const address = normalizeAddress(href) ?? href.trim();
      if (address !== '') openAddress(address);
    },
    [openAddress],
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
      return <HomePage personName={personName} onOpen={openAddress} />;
    case 'search':
      return <NotBuiltPage name="Search" />;
    case 'history':
      return <NotBuiltPage name="History" />;
    case 'publish':
      return <NotBuiltPage name="Publish" />;
  }
}
