import type { ReactNode } from 'react';

function Icon({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const BackIcon = () => (
  <Icon>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </Icon>
);

export const ForwardIcon = () => (
  <Icon>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </Icon>
);

export const PublishIcon = () => (
  <Icon>
    <path d="M12 20h8" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const HistoryIcon = () => (
  <Icon>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3.5 4.5V9h4.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const ChevronIcon = () => (
  <Icon>
    <path d="m7 10 5 5 5-5" />
  </Icon>
);

/** Concentric rings, like a tide pool or ripples spreading from one small point. */
export const LogoMark = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="16" cy="16" r="14" strokeWidth="1.4" opacity="0.4" />
    <circle cx="16" cy="16" r="8.5" strokeWidth="1.8" opacity="0.72" />
    <circle cx="16" cy="16" r="3.2" fill="currentColor" stroke="none" />
  </svg>
);
