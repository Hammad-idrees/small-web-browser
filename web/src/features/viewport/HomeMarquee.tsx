import styles from './HomeMarquee.module.css';

const PAIRS = [
  ['One page per site', 'One address each'],
  ['Written by strangers', 'Read by anyone'],
  ['Follow every link', 'Even the broken ones'],
  ['Publish in a minute', 'Live the moment you do'],
] as const;

function Run({ hidden }: { readonly hidden?: boolean }) {
  return (
    <ul className={styles.run} aria-hidden={hidden ? true : undefined}>
      {PAIRS.map(([strong, soft]) => (
        <li key={strong} className={styles.pair}>
          <span className={styles.strong}>{strong}</span>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.soft}>{soft}</span>
          <span className={styles.slashes} aria-hidden="true">
            //
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A slim strip of phrases sliding past under the hero. The run is drawn twice, so
 * it loops without a seam; the copy is hidden from screen readers.
 */
export function HomeMarquee() {
  return (
    <section className={styles.marquee} aria-label="What the small web is">
      <div className={styles.track}>
        <Run />
        <Run hidden />
      </div>
    </section>
  );
}
