/**
 * Where the browser tests run. Their own ports and their own database, so a
 * developer's running app and data are never touched.
 */
export const WEB_PORT = 3100;
export const API_PORT = 4100;
export const WEB_URL = `http://localhost:${String(WEB_PORT)}`;
export const API_URL = `http://localhost:${String(API_PORT)}`;
export const MONGODB_URI =
  process.env.E2E_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/small_web_e2e';

/** The web app is built into its own folder for these tests. */
export const WEB_DIST_DIR = '.next-e2e';
