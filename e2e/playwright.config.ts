import { defineConfig, devices } from '@playwright/test';
import {
  API_PORT,
  API_URL,
  MONGODB_URI,
  WEB_DIST_DIR,
  WEB_PORT,
  WEB_URL,
} from './settings';

/**
 * The built app and API, started on their own ports against their own database,
 * and driven in Chromium. Build first with `pnpm --filter e2e build`.
 */
export default defineConfig({
  testDir: './tests',
  // The tests share one database and some publish to it, so they run in order.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './global-setup.ts',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'api',
      command: 'node dist/main.js',
      cwd: '../api',
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        PORT: String(API_PORT),
        MONGODB_URI,
        WEB_ORIGIN: WEB_URL,
        PUBLISH_LIMIT_PER_MINUTE: '1000',
      },
    },
    {
      name: 'web',
      command: `pnpm exec next start -p ${String(WEB_PORT)}`,
      cwd: '../web',
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { NEXT_DIST_DIR: WEB_DIST_DIR },
    },
  ],
});
