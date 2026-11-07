import { Button } from '@/components/Button';
import styles from './pages.module.css';

export function OfflinePage({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className={styles.page} role="alert">
      <div className={styles.nowhere}>
        <h1 className={styles.nowhereTitle}>Can&rsquo;t reach the small web</h1>
        <p className={styles.lede}>
          The small web is not answering. Check that the API is running and has
          been seeded, then try again.
        </p>
        <div className={styles.actions}>
          <Button variant="solid" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
