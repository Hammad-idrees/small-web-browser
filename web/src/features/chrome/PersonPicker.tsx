'use client';

import type { Person } from '@small-web/contracts';
import type { CSSProperties } from 'react';
import { ChevronIcon } from './icons';
import styles from './Toolbar.module.css';

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

interface PersonPickerProps {
  readonly people: readonly Person[];
  readonly personId: string | null;
  readonly onChange: (personId: string) => void;
}

/** A real select laid over the chip, so it keeps its keyboard and screen reader support. */
export function PersonPicker({
  people,
  personId,
  onChange,
}: PersonPickerProps) {
  const person = people.find((candidate) => candidate.id === personId);

  return (
    <label className={styles.person}>
      <span className={styles.visuallyHidden}>Browsing as</span>
      <span
        className={styles.avatar}
        style={
          person
            ? ({ '--avatar-hue': hueFor(person.name) } as CSSProperties)
            : undefined
        }
        aria-hidden="true"
      >
        {person ? initialsOf(person.name) : ''}
      </span>
      <span className={styles.personName} aria-hidden="true">
        {person?.name ?? ''}
      </span>
      <span className={styles.personChevron} aria-hidden="true">
        <ChevronIcon />
      </span>
      <select
        className={styles.personSelect}
        value={personId ?? ''}
        disabled={people.length === 0}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {people.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </select>
    </label>
  );
}
