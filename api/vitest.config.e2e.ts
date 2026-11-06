import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Suites share one database, so they must not run at the same time.
    fileParallelism: false,
    env: { MONGODB_URI: 'mongodb://127.0.0.1:27017/small_web_test' },
  },
});
