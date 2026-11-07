import styles from './pages.module.css';

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
      <div className={styles.home}>
        <svg
          className={styles.rings}
          viewBox="0 0 200 200"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="100" cy="100" r="96" />
          <circle cx="100" cy="100" r="72" />
          <circle cx="100" cy="100" r="48" />
          <circle cx="100" cy="100" r="24" />
        </svg>

        <p className={styles.eyebrow}>
          {personName ? `Browsing as ${personName}` : 'Welcome'}
        </p>
        <h1 className={styles.headline}>
          A small web, <em>written by strangers.</em>
        </h1>
        <p className={styles.lede}>
          One-page sites, each at an address of its own. Type one above, or
          begin with a page someone left here.
        </p>

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
    </div>
  );
}
