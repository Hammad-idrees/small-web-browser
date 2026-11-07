import { Button } from '@/components/Button';
import styles from './pages.module.css';
import { StatusLayout } from './StatusPages';

interface NowherePageProps {
  readonly address: string;
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly onHome: () => void;
}

/** An address with nothing at it. A real stop on the trail, so Back works from here. */
export function NowherePage({
  address,
  canGoBack,
  onBack,
  onHome,
}: NowherePageProps) {
  return (
    <StatusLayout
      title="Nowhere"
      subtitle="Nothing lives at this address"
      actions={
        <>
          {canGoBack ? (
            <Button variant="solid" onClick={onBack}>
              Go back
            </Button>
          ) : null}
          <Button variant="outline" onClick={onHome}>
            Start page
          </Button>
        </>
      }
    >
      <p className={styles.deadAddress}>{address}</p>
      <p className={styles.lede}>
        It may have been lost, or it may never have existed at all.
      </p>
    </StatusLayout>
  );
}
