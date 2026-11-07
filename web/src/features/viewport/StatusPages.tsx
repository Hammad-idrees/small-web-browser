import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import styles from './pages.module.css';

interface StatusLayoutProps {
  /** Set huge and in capitals, like the page banners. */
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
  readonly actions: ReactNode;
  readonly role?: 'alert';
}

/**
 * A page that stands in for one that is not there: white, the start page's grid,
 * a slowly turning dashed ring, and a way out.
 */
export function StatusLayout({
  title,
  subtitle,
  children,
  actions,
  role,
}: StatusLayoutProps) {
  return (
    <div className={styles.page} role={role}>
      <div className={styles.status}>
        <svg
          className={styles.statusRing}
          viewBox="0 0 120 120"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="60" cy="60" r="56" />
          <circle cx="60" cy="60" r="36" />
          <circle cx="60" cy="60" r="4" className={styles.statusDot} />
        </svg>

        <h1 className={styles.statusTitle}>{title}</h1>
        <p className={styles.statusSubtitle}>{subtitle}</p>
        {children}
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  );
}

export function OfflinePage({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <StatusLayout
      role="alert"
      title="Offline"
      subtitle="Can’t reach the small web"
      actions={
        <Button variant="solid" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      <p className={styles.lede}>
        The small web is not answering. Check that the API is running and has
        been seeded, then try again.
      </p>
    </StatusLayout>
  );
}
