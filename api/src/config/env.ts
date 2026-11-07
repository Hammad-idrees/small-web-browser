import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'must be a mongodb:// connection string')
    .default('mongodb://127.0.0.1:27017/small_web'),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  PUBLISH_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(20),
});

export type Env = z.infer<typeof envSchema>;

/** Parses the environment, throwing a readable error so a bad deploy fails at startup. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (result.success) return result.data;

  const problems = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${problems}`);
}
