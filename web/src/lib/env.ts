import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:4000'),
});

const result = envSchema.safeParse({
  // Named in full because Next.js inlines NEXT_PUBLIC_ values by exact name.
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!result.success) {
  const problems = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

export const env = result.data;
