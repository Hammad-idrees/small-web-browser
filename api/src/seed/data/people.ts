export const PEOPLE = [
  'Mara Quill',
  'Theo Lindqvist',
  'Ines Okoye',
  'Bram Ottley',
  'Noor Haddad',
  'Sol Verano',
] as const;

export type PersonName = (typeof PEOPLE)[number];
