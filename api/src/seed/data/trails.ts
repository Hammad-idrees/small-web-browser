import type { VisitVia } from '@small-web/contracts';
import type { PersonName } from './people.js';

export type TrailStep = readonly [via: VisitVia, address: string];

/** One sitting: a person starts at a given minute of the seeded hour and moves through addresses. */
export interface Trail {
  person: PersonName;
  startMinute: number;
  steps: readonly TrailStep[];
}

/** A repeatable path through the seeded web: four deep, and ending beside a dead link. */
export const DEMO_WALK = {
  trail: ['tidepool.zz', 'harbourlight.zz', 'nightferry.zz', 'oldmaps.zz'],
  deadLink: 'atlantis-archive.zz',
  searchTerm: 'lighthouse',
  freeAddress: 'driftwood.zz',
} as const;

export const TRAILS: readonly Trail[] = [
  {
    person: 'Noor Haddad',
    startMinute: 2,
    steps: [
      ['typed', 'tidepool.zz'],
      ['link', 'harbourlight.zz'],
      ['link', 'nightferry.zz'],
      ['link', 'shortwave.zz'],
      ['link', 'inkandpress.zz'],
      ['link', 'slowdough.zz'],
      ['link', 'hivewatch.zz'],
      ['link', 'saltmarsh.zz'],
    ],
  },
  {
    person: 'Sol Verano',
    startMinute: 4,
    steps: [['typed', 'tidepool.zz']],
  },
  {
    person: 'Mara Quill',
    startMinute: 5,
    steps: [
      ['typed', 'nightferry.zz'],
      ['link', 'oldmaps.zz'],
      ['link', 'shortwave.zz'],
      ['link', 'quietradio.zz'],
    ],
  },
  {
    person: 'Theo Lindqvist',
    startMinute: 10,
    steps: [
      ['search', 'slowdough.zz'],
      ['link', 'hivewatch.zz'],
      ['link', 'mossgarden.zz'],
      ['link', 'tidepool.zz'],
      ['link', 'saltmarsh.zz'],
    ],
  },
  {
    person: 'Ines Okoye',
    startMinute: 15,
    steps: [
      ['typed', 'inkandpress.zz'],
      ['link', 'oldmaps.zz'],
    ],
  },
  {
    person: 'Noor Haddad',
    startMinute: 20,
    steps: [
      ['typed', 'oldmaps.zz'],
      ['link', 'atlantis-archive.zz'],
    ],
  },
  {
    person: 'Bram Ottley',
    startMinute: 25,
    steps: [
      ['typed', 'harbourlight.zz'],
      ['link', 'tidepool.zz'],
      ['link', 'lostpier.zz'],
    ],
  },
  {
    person: 'Mara Quill',
    startMinute: 30,
    steps: [
      ['typed', 'tidepool.zz'],
      ['history', 'nightferry.zz'],
      ['link', 'harbourlight.zz'],
    ],
  },
  {
    person: 'Noor Haddad',
    startMinute: 34,
    steps: [
      ['search', 'mossgarden.zz'],
      ['link', 'greenhouse-club.zz'],
      ['history', 'tidepool.zz'],
    ],
  },
  {
    person: 'Theo Lindqvist',
    startMinute: 40,
    steps: [
      ['typed', 'hivewatch.zz'],
      ['history', 'tidepool.zz'],
    ],
  },
  {
    person: 'Sol Verano',
    startMinute: 44,
    steps: [
      ['history', 'tidepool.zz'],
      ['typed', 'shortwave.zz'],
      ['link', 'nightferry.zz'],
    ],
  },
  {
    person: 'Ines Okoye',
    startMinute: 52,
    steps: [
      ['history', 'inkandpress.zz'],
      ['typed', 'tidepol.zz'],
    ],
  },
];
