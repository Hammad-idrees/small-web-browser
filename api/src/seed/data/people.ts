export const PEOPLE = [
  'Sarah Jones',
  'John Smith',
  'Emma Wilson',
  'Ben Taylor',
  'David Miller',
  'Mike Brown',
] as const;

export type PersonName = (typeof PEOPLE)[number];
