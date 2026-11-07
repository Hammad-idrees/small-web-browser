import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('applies development defaults when nothing is set', () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      MONGODB_URI: 'mongodb://127.0.0.1:27017/small_web',
      WEB_ORIGIN: 'http://localhost:3000',
      PUBLISH_LIMIT_PER_MINUTE: 20,
    });
  });

  it('coerces PORT from a string', () => {
    expect(parseEnv({ PORT: '5000' }).PORT).toBe(5000);
  });

  it.each([
    ['PORT', 'not-a-port'],
    ['PORT', '70000'],
    ['MONGODB_URI', 'http://example.com'],
    ['WEB_ORIGIN', 'not a url'],
    ['PUBLISH_LIMIT_PER_MINUTE', '0'],
    ['NODE_ENV', 'staging'],
  ])('rejects an invalid %s and names it in the error', (key, value) => {
    expect(() => parseEnv({ [key]: value })).toThrow(key);
  });
});
