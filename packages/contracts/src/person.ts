import { z } from 'zod';
import { objectIdSchema } from './site.js';

/** Someone to browse or publish as. Picking a name is the only identity there is. */
export const personSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
});

export type Person = z.infer<typeof personSchema>;
