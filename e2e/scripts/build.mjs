// Builds the API and a web app pointed at the test API, for the browser tests.
// The web build goes to its own folder, so it never replaces a dev build.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const API_URL = 'http://localhost:4100';

function run(label, args, env = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync('pnpm', args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`✖ ${label} failed`);
    process.exit(result.status ?? 1);
  }
}

run('Building the API', ['--filter', 'api', 'build']);
run('Building the web app for the tests', ['--filter', 'web', 'build'], {
  NEXT_PUBLIC_API_URL: API_URL,
  NEXT_DIST_DIR: '.next-e2e',
});
