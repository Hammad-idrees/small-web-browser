import type { CSSProperties } from 'react';
import styles from './HomeMarquee.module.css';

/**
 * What this site is built with. Logos are from Simple Icons (CC0), kept in
 * /public/stack, each drawn in its brand's own colour.
 */
const STACK = [
  { name: 'Next.js', file: 'nextdotjs', colour: '#000000' },
  { name: 'React', file: 'react', colour: '#61dafb' },
  { name: 'TypeScript', file: 'typescript', colour: '#3178c6' },
  { name: 'Node.js', file: 'nodedotjs', colour: '#5fa04e' },
  { name: 'NestJS', file: 'nestjs', colour: '#e0234e' },
  { name: 'MongoDB', file: 'mongodb', colour: '#47a248' },
  { name: 'Mongoose', file: 'mongoose', colour: '#c63c3c' },
  { name: 'Zod', file: 'zod', colour: '#3e67b1' },
  { name: 'pnpm', file: 'pnpm', colour: '#f69220' },
  { name: 'Vitest', file: 'vitest', colour: '#729b1b' },
] as const;

function Run({ hidden }: { readonly hidden?: boolean }) {
  return (
    <ul className={styles.run} aria-hidden={hidden ? true : undefined}>
      {STACK.map(({ name, file, colour }) => (
        <li key={name} className={styles.item}>
          {/* A clear glass tile; the logo is drawn as a mask in the brand's colour. */}
          <span className={styles.tile} title={name}>
            <span
              className={styles.logo}
              style={
                {
                  '--logo': `url(/stack/${file}.svg)`,
                  '--brand': colour,
                } as CSSProperties
              }
            />
          </span>
          <span className={styles.name}>{name}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A slim white strip under the hero: the stack's logos on glass tiles, sliding past. The run
 * is drawn twice so it loops without a seam; the copy is hidden from screen readers.
 */
export function HomeMarquee() {
  return (
    <section className={styles.marquee} aria-label="Built with">
      <div className={styles.track}>
        <Run />
        <Run hidden />
      </div>
    </section>
  );
}
