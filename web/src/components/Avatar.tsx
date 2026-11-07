import type { CSSProperties } from 'react';
import styles from './Avatar.module.css';

const AVATAR_HUES = [172, 24, 205, 340, 95, 262];

/** The same name always gets the same colour. */
function hueFor(name: string): number {
  let total = 0;
  for (const character of name) total += character.charCodeAt(0);
  return AVATAR_HUES[total % AVATAR_HUES.length] ?? 172;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

interface AvatarProps {
  readonly name: string;
  /** Width and height in pixels. */
  readonly size?: number;
  /** `dark` for dark surfaces like the navbar, `light` for white pages. */
  readonly tone?: 'dark' | 'light';
  readonly className?: string;
}

/** A person's initials on a colour of their own. Decorative: the name is said nearby. */
export function Avatar({
  name,
  size = 28,
  tone = 'dark',
  className,
}: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${tone === 'light' ? styles.light : ''} ${className ?? ''}`}
      style={
        {
          '--avatar-hue': hueFor(name),
          '--avatar-size': `${String(size)}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
