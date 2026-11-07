'use client';

import { useCallback, useRef, useState } from 'react';
import { versionUrl } from '@/lib/api-client';
import styles from './SiteFrame.module.css';
import { restoreFrameScroll, useFrameBridge } from './useFrameBridge';

interface SiteFrameProps {
  readonly versionId: string;
  readonly title: string;
  readonly scrollY: number;
  readonly onNavigate: (href: string) => void;
  readonly onScroll: (y: number) => void;
}

/**
 * Shows one contained page. The parent gives this a new `key` for every trail entry,
 * so each page gets a brand new iframe. Changing the `src` of an existing iframe
 * would add a hidden entry to the browser's history and break Back.
 */
export function SiteFrame({
  versionId,
  title,
  scrollY,
  onNavigate,
  onScroll,
}: SiteFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  // Only where the page was when it was opened. Later reports must not rescroll it.
  const [initialScroll] = useState(scrollY);
  const [revealed, setRevealed] = useState(false);

  const onReady = useCallback(() => {
    if (frame.current && initialScroll > 0) {
      restoreFrameScroll(frame.current, initialScroll);
    }
    setRevealed(true);
  }, [initialScroll]);

  useFrameBridge(frame, { onReady, onNavigate, onScroll });

  return (
    <iframe
      ref={frame}
      // The third containment layer, alongside the header the document is served with.
      sandbox="allow-scripts"
      src={versionUrl(versionId)}
      title={title}
      referrerPolicy="no-referrer"
      className={`${styles.frame} ${revealed ? styles.revealed : ''}`}
      // A page that fails to load never reports ready, and must not stay invisible.
      onLoad={() => {
        setRevealed(true);
      }}
    />
  );
}
