import styles from './pages.module.css';

interface NowherePageProps {
  readonly address: string;
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly onHome: () => void;
}

export function NowherePage({
  address,
  canGoBack,
  onBack,
  onHome,
}: NowherePageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.nowhere}>
        <svg
          className={styles.emptyRing}
          viewBox="0 0 120 120"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="60" cy="60" r="56" />
          <circle cx="60" cy="60" r="34" />
        </svg>

        <h1 className={styles.nowhereTitle}>Nowhere</h1>
        <p className={styles.nowhereAddress}>{address}</p>
        <p className={styles.lede}>
          Nothing lives at this address. It may have been lost, or it may never
          have existed at all.
        </p>

        <div className={styles.actions}>
          {canGoBack ? (
            <button type="button" className={styles.primary} onClick={onBack}>
              Go back
            </button>
          ) : null}
          <button type="button" className={styles.secondary} onClick={onHome}>
            Start page
          </button>
        </div>
      </div>
    </div>
  );
}
