'use client';

import { type SubmitEvent, useRef } from 'react';
import { type Route, routeFromInput } from '../navigation/route-codec';
import type { TrailLocation } from '../navigation/trail';
import { SearchIcon } from './icons';
import styles from './Toolbar.module.css';

interface AddressBarProps {
  readonly text: string;
  readonly location: TrailLocation | undefined;
  readonly disabled: boolean;
  readonly onSubmit: (route: Route) => void;
}

/**
 * The parent gives this a new `key` whenever `text` changes, which resets the field.
 * What someone is typing stays theirs until then.
 */
export function AddressBar({
  text,
  location,
  disabled,
  onSubmit,
}: AddressBarProps) {
  const input = useRef<HTMLInputElement>(null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const route = routeFromInput(input.current?.value ?? '');
    if (!route) return;
    input.current?.blur();
    onSubmit(route);
  };

  return (
    <form className={styles.addressBar} role="search" onSubmit={submit}>
      <span className={styles.addressIcon} aria-hidden="true">
        {location?.kind === 'site' ? (
          <span className={styles.dotLive} />
        ) : location?.kind === 'nowhere' ? (
          <span className={styles.dotDead} />
        ) : (
          <SearchIcon />
        )}
      </span>
      <input
        ref={input}
        className={styles.addressInput}
        name="address"
        defaultValue={text}
        disabled={disabled}
        aria-label="Address"
        placeholder="Type an address, like tidepool.zz"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        onFocus={(event) => {
          event.target.select();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.currentTarget.value = text;
            event.currentTarget.blur();
          }
        }}
      />
      {location?.kind === 'site' ? (
        <span className={styles.byline}>by {location.authorName}</span>
      ) : null}
    </form>
  );
}
