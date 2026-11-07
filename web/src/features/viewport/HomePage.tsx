import styles from './pages.module.css';

const FIRST_STOP = 'tidepool.zz';

const PLACES_TO_BEGIN = [
  {
    address: 'tidepool.zz',
    title: 'The Tide Pool Journal',
    blurb: 'Eleven years of notes on the same few rock pools.',
  },
  {
    address: 'oldmaps.zz',
    title: 'Old Maps, Wrong Maps',
    blurb: 'Honest charts, careful people, and islands that never were.',
  },
  {
    address: 'nightferry.zz',
    title: 'Notes from the Night Ferry',
    blurb: 'The last boat of the day, and the dozen people on it.',
  },
  {
    address: 'slowdough.zz',
    title: 'Slow Dough',
    blurb: 'A nine-year-old starter called Gerald, and what it taught.',
  },
] as const;

interface HomePageProps {
  readonly personName: string | undefined;
  readonly onOpen: (address: string) => void;
}

export function HomePage({ personName, onOpen }: HomePageProps) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />

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
          <button
            type="button"
            className={styles.cta}
            onClick={() => {
              onOpen(FIRST_STOP);
            }}
          >
            Start wandering
          </button>
        </div>
      </section>

      <section className={styles.begin} aria-labelledby="places-to-begin">
        <div className={styles.beginInner}>
          <h2 id="places-to-begin" className={styles.beginTitle}>
            Places to begin
          </h2>
          <ul className={styles.places}>
            {PLACES_TO_BEGIN.map((place) => (
              <li key={place.address}>
                <button
                  type="button"
                  className={styles.place}
                  onClick={() => {
                    onOpen(place.address);
                  }}
                >
                  <span className={styles.placeAddress}>{place.address}</span>
                  <span className={styles.placeTitle}>{place.title}</span>
                  <span className={styles.placeBlurb}>{place.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
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
