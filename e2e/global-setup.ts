import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { MONGODB_URI } from './settings';

/**
 * Seeds the test database before every run, so each run starts from the same
 * small web, whatever an earlier run published.
 */
export default function globalSetup(): void {
  const api = fileURLToPath(new URL('../api', import.meta.url));
  const result = spawnSync('node', ['dist/seed/seed.js'], {
    cwd: api,
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI, NODE_ENV: 'test' },
  });
  if (result.status !== 0) {
    throw new Error(
      'Seeding the test database failed. Is MongoDB running, and was the API built (pnpm --filter e2e build)?',
    );
  }
}
