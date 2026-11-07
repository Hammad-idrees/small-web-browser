'use client';

import {
  BRIDGE_SOURCE,
  frameMessageSchema,
  type HostMessage,
} from '@small-web/contracts';
import { type RefObject, useEffect } from 'react';

interface FrameBridgeHandlers {
  readonly onReady: () => void;
  readonly onNavigate: (href: string) => void;
  readonly onScroll: (y: number) => void;
}

/**
 * Listens to one contained page. A contained page is untrusted, so a message is only
 * believed if it came from this exact frame and matches the shared protocol. Its
 * origin cannot be checked, because a sandboxed frame has none.
 */
export function useFrameBridge(
  frame: RefObject<HTMLIFrameElement | null>,
  handlers: FrameBridgeHandlers,
): void {
  const { onReady, onNavigate, onScroll } = handlers;

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (!frame.current || event.source !== frame.current.contentWindow) {
        return;
      }

      const message = frameMessageSchema.safeParse(event.data);
      if (!message.success) return;

      switch (message.data.type) {
        case 'ready':
          onReady();
          break;
        case 'navigate':
          onNavigate(message.data.href);
          break;
        case 'scroll':
          onScroll(message.data.y);
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [frame, onReady, onNavigate, onScroll]);
}

/** Asks a contained page to scroll to where it was left. */
export function restoreFrameScroll(frame: HTMLIFrameElement, y: number): void {
  const message: HostMessage = { source: BRIDGE_SOURCE, type: 'restore', y };
  // A sandboxed frame has an opaque origin, so '*' is the only target that reaches it.
  frame.contentWindow?.postMessage(message, '*');
}
