import type { NextConfig } from 'next';
// Importing validates the environment, so bad values stop dev and build at startup.
import { env } from './src/lib/env';

const apiOrigin = new URL(env.NEXT_PUBLIC_API_URL).origin;

/**
 * Sent with every page. The policy stays narrow on purpose: it does not restrict
 * scripts or styles (Next.js needs its own inline ones), but it does pin down
 * what matters here. Frames may come only from the API, which serves the
 * contained pages; no one may frame the app; no plugins; no rebased URLs.
 */
const contentSecurityPolicy = [
  `frame-src ${apiOrigin}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  // The browser tests build into their own folder, so they never touch a dev build.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
