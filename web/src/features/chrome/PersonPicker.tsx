'use client';

import type { Person } from '@small-web/contracts';
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { CheckIcon, ChevronIcon } from './icons';
import styles from './PersonPicker.module.css';

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

function Avatar({ name, large }: { readonly name: string; readonly large?: boolean }) {
  return (
    <span
      className={`${styles.avatar} ${large ? styles.avatarLarge : ''}`}
      style={{ '--avatar-hue': hueFor(name) } as CSSProperties}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

interface PersonPickerProps {
  readonly people: readonly Person[];
  readonly personId: string | null;
  readonly onChange: (personId: string) => void;
}

/**
 * Who is browsing. A button that opens a listbox, following the ARIA listbox pattern:
 * arrows, Home and End move, Enter or Space chooses, Escape closes, and typing a
 * letter jumps to the next name that starts with it.
 */
export function PersonPicker({ people, personId, onChange }: PersonPickerProps) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const person = people.find((candidate) => candidate.id === personId);
  const selectedIndex = Math.max(
    0,
    people.findIndex((candidate) => candidate.id === personId),
  );

  const openList = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  const choose = (index: number) => {
    const chosen = people[index];
    close(true);
    if (chosen && chosen.id !== personId) onChange(chosen.id);
  };

  // The list takes focus while open, so the keys below reach it.
  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);

  // A press anywhere outside closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openList();
    }
  };

  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    const last = people.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key] ?? active);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(active);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    } else if (/^\p{L}$/u.test(event.key)) {
      const letter = event.key.toLowerCase();
      const order = [...people.keys()].map((i) => (active + 1 + i) % people.length);
      const match = order.find((i) =>
        people[i]?.name.toLowerCase().startsWith(letter),
      );
      if (match !== undefined) setActive(match);
    }
  };

  return (
    <div className={styles.picker} ref={root}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-label={person ? `Browsing as ${person.name}` : 'Browsing as'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={people.length === 0}
        onClick={() => {
          if (open) close(false);
          else openList();
        }}
        onKeyDown={onTriggerKey}
      >
        {person ? <Avatar name={person.name} /> : <span className={styles.avatar} />}
        <span className={styles.name}>{person?.name ?? ''}</span>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.panel}>
          <p className={styles.panelLabel} id={`${listId}-label`}>
            Browse as
          </p>
          <ul
            ref={list}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className={styles.list}
            aria-labelledby={`${listId}-label`}
            aria-activedescendant={`${listId}-${String(active)}`}
            onKeyDown={onListKey}
          >
            {people.map((candidate, index) => {
              const selected = candidate.id === personId;
              return (
                <li
                  key={candidate.id}
                  id={`${listId}-${String(index)}`}
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option} ${index === active ? styles.active : ''}`}
                  onPointerEnter={() => {
                    setActive(index);
                  }}
                  onClick={() => {
                    choose(index);
                  }}
                >
                  <Avatar name={candidate.name} large />
                  <span className={styles.optionName}>{candidate.name}</span>
                  {selected ? (
                    <span className={styles.check} aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
