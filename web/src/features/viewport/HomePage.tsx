import Image from 'next/image';
import { Button } from '@/components/Button';
import { HomeSections } from './HomeSections';
import styles from './pages.module.css';

const FIRST_STOP = 'tidepool.zz';

interface HomePageProps {
  readonly personName: string | undefined;
  readonly onOpen: (address: string) => void;
  readonly onPublish: () => void;
}

export function HomePage({ personName, onOpen, onPublish }: HomePageProps) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        {/* Decoration only: two copies of the same knot, drifting in opposite corners. */}
        <Image
          className={`${styles.knot} ${styles.knotLead}`}
          src="/hero/emerald.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={900}
          sizes="(max-width: 720px) 150px, 300px"
          priority
        />
        <Image
          className={`${styles.knot} ${styles.knotEcho}`}
          src="/hero/emerald.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={900}
          sizes="(max-width: 720px) 130px, 250px"
        />

        <p className={styles.chip}>
          <span className={styles.chipDot} aria-hidden="true" />
          {personName ? `Browsing as ${personName}` : 'Welcome'}
        </p>

        <h1 className={styles.headline}>
          <span className={styles.lineFaint}>A small web,</span>
          <span className={styles.lineMid}>of one-page sites</span>
          <span className={styles.lineBright}>
            written by <RippleGlyph /> strangers
          </span>
        </h1>

        <p className={styles.heroLede}>
          Every site is a single page at an address of its own. Type one above,
          follow the links, and see where a stranger&rsquo;s page leads.
        </p>

        <div className={styles.heroActions}>
          <Button
            variant="neon"
            size="lg"
            className={styles.cta}
            onClick={() => {
              onOpen(FIRST_STOP);
            }}
          >
            Start wandering
          </Button>
        </div>
      </section>

      <HomeSections onOpen={onOpen} onPublish={onPublish} />
    </div>
  );
}

/** Ripples spreading from one small point: the logo, lit up inside the headline. */
function RippleGlyph() {
  return (
    <svg
      className={styles.glyph}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="14" strokeWidth="1.3" opacity="0.45" />
      <circle cx="16" cy="16" r="9.5" strokeWidth="1.6" opacity="0.75" />
      <circle cx="16" cy="16" r="5" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
