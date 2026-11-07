import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Self-hosted at build time, so pages make no request to Google at runtime.
const display = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display-face',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Small Web',
  description: 'A browser for a small web of one-page sites.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
