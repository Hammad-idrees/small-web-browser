import { Button } from '@/components/Button';
import styles from './HomeSections.module.css';

const PLACES_TO_BEGIN = [
  {
    address: 'tidepool.zz',
    title: 'The Tide Pool Journal',
    blurb:
      'Eleven years of notes on the same few rock pools, and the creatures that never leave them.',
    author: 'Mara Quill',
    topic: 'Field notes',
  },
  {
    address: 'oldmaps.zz',
    title: 'Old Maps, Wrong Maps',
    blurb:
      'Honest charts, careful people, and the islands that were drawn in but never were.',
    author: 'Noor Haddad',
    topic: 'Cartography',
  },
  {
    address: 'nightferry.zz',
    title: 'Notes from the Night Ferry',
    blurb:
      'The last boat of the day, the dozen people who ride it, and what they talk about.',
    author: 'Theo Lindqvist',
    topic: 'Travel',
  },
  {
    address: 'slowdough.zz',
    title: 'Slow Dough',
    blurb:
      'A nine-year-old starter called Gerald, and everything it has taught about patience.',
    author: 'Ines Okoye',
    topic: 'Kitchen',
  },
] as const;

const STEPS = [
  {
    title: 'Type an address',
    text: 'Every site lives at an address of its own, like tidepool.zz. Type one into the bar above and go.',
  },
  {
    title: 'Follow the links',
    text: 'Pages point to each other, and sometimes to places that never existed. Back and Forward always find the way home.',
  },
  {
    title: 'Publish your own',
    text: 'Choose an address ending in .zz and put a page of HTML there. It is live, and searchable, the moment you publish.',
  },
] as const;

interface HomeSectionsProps {
  readonly onOpen: (address: string) => void;
  readonly onPublish: () => void;
}

/** Everything below the hero on the start page, on white. */
export function HomeSections({ onOpen, onPublish }: HomeSectionsProps) {
  return (
    <div className={styles.sections}>
      <section className={styles.section} aria-labelledby="places-to-begin">
        <header className={styles.headerStacked}>
          <p className={styles.eyebrow}>Places to begin</p>
          <h2 id="places-to-begin" className={styles.heading}>
            Four doors into the small web.
          </h2>
        </header>

        <ul className={styles.cards}>
          {PLACES_TO_BEGIN.map((place, index) => (
            <li key={place.address}>
              <button
                type="button"
                className={styles.card}
                onClick={() => {
                  onOpen(place.address);
                }}
              >
                <Ripples />
                <span className={styles.cardTop}>
                  <span className={styles.index}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.topic}>{place.topic}</span>
                </span>

                <span className={styles.cardBody}>
                  <span className={styles.address}>
                    <span className={styles.dot} aria-hidden="true" />
                    {place.address}
                  </span>
                  <span className={styles.title}>{place.title}</span>
                  <span className={styles.blurb}>{place.blurb}</span>
                </span>

                <span className={styles.cardFoot}>
                  <span className={styles.author}>by {place.author}</span>
                  <span className={styles.go} aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="how-it-works">
        <header className={styles.headerStacked}>
          <p className={styles.eyebrow}>How it works</p>
          <h2 id="how-it-works" className={styles.heading}>
            A browser for a smaller web.
          </h2>
        </header>

        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>

        <div className={styles.closing}>
          <p className={styles.closingText}>
            Have something to say? The small web has room for one more page.
          </p>
          <Button variant="solid" size="lg" onClick={onPublish}>
            Publish a page
          </Button>
        </div>
      </section>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

/** The logo's ripples, faint in the card's corner until the card is hovered. */
function Ripples() {
  return (
    <svg
      className={styles.ripples}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="100" cy="100" r="96" />
      <circle cx="100" cy="100" r="70" />
      <circle cx="100" cy="100" r="44" />
      <circle cx="100" cy="100" r="18" />
    </svg>
  );
}
