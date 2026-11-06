import { z } from 'zod';

/** Marks a message as part of this protocol, so unrelated messages are ignored. */
export const BRIDGE_SOURCE = 'small-web-bridge';

/**
 * Messages sent from a contained page to the app around it. Whatever arrives is
 * treated as untrusted and parsed with this schema before it is used.
 */
export const frameMessageSchema = z.discriminatedUnion('type', [
  z.object({ source: z.literal(BRIDGE_SOURCE), type: z.literal('ready') }),
  z.object({
    source: z.literal(BRIDGE_SOURCE),
    type: z.literal('navigate'),
    href: z.string().max(2048),
  }),
  z.object({
    source: z.literal(BRIDGE_SOURCE),
    type: z.literal('scroll'),
    y: z.number().finite().min(0),
  }),
]);

export type FrameMessage = z.infer<typeof frameMessageSchema>;

/** Messages sent from the app to a contained page. */
export const hostMessageSchema = z.object({
  source: z.literal(BRIDGE_SOURCE),
  type: z.literal('restore'),
  y: z.number().finite().min(0),
});

export type HostMessage = z.infer<typeof hostMessageSchema>;
