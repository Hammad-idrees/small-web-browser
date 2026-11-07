import styles from './pages.module.css';

export function OfflinePage({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className={styles.page} role="alert">
      <div className={styles.nowhere}>
        <h1 className={styles.nowhereTitle}>Out of range</h1>
        <p className={styles.lede}>
          The small web is not answering. Check that the API is running and has
          been seeded, then try again.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
