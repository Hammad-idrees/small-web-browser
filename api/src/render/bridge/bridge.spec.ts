import { BRIDGE_SOURCE, frameMessageSchema } from '@small-web/contracts';
import { JSDOM } from 'jsdom';
import { BRIDGE_SCRIPT } from './bridge.js';

/** Runs the bridge in a simulated page, recording what it sends to its host. */
function loadPage(body: string) {
  const dom = new JSDOM(
    `<!doctype html><html><head><script>${BRIDGE_SCRIPT}</script></head><body>${body}</body></html>`,
    { runScripts: 'dangerously', pretendToBeVisual: true },
  );
  const { window } = dom;
  const sent: unknown[] = [];
  window.postMessage = ((message: unknown) => {
    sent.push(message);
  }) as typeof window.postMessage;
  return { window, sent };
}

function click(
  window: JSDOM['window'],
  selector: string,
  init: MouseEventInit = {},
) {
  const event = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  window.document.querySelector(selector)?.dispatchEvent(event);
  return event;
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('bridge script', () => {
  it('reports a link click, exactly as written, and cancels it', () => {
    const { window, sent } = loadPage(
      '<a id="go" href="HARBOURLIGHT.zz">x</a>',
    );
    const event = click(window, '#go');

    expect(event.defaultPrevented).toBe(true);
    expect(sent).toEqual([
      { source: BRIDGE_SOURCE, type: 'navigate', href: 'HARBOURLIGHT.zz' },
    ]);
  });

  it('finds the link when a child element is what was clicked', () => {
    const { window, sent } = loadPage('<a href="a.zz"><b id="in">x</b></a>');
    click(window, '#in');
    expect(sent).toHaveLength(1);
  });

  it('cancels modified clicks, so they cannot open a new window', () => {
    const { window, sent } = loadPage('<a id="go" href="a.zz">x</a>');
    const event = click(window, '#go', { ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(sent).toHaveLength(1);
  });

  it('ignores clicks outside links', () => {
    const { window, sent } = loadPage('<p id="plain">x</p>');
    const event = click(window, '#plain');
    expect(event.defaultPrevented).toBe(false);
    expect(sent).toEqual([]);
  });

  it('handles in-page links itself, without telling the host', () => {
    const { window, sent } = loadPage(
      '<a id="go" href="#end">x</a><p id="end">y</p>',
    );
    const scrolled = vi.fn();
    const target = window.document.getElementById('end');
    if (target) target.scrollIntoView = scrolled;

    const event = click(window, '#go');

    expect(event.defaultPrevented).toBe(true);
    expect(scrolled).toHaveBeenCalledOnce();
    expect(sent).toEqual([]);
    expect(window.location.hash).toBe('');
  });

  it('reports the scroll position, batching rapid changes', async () => {
    const { window, sent } = loadPage('<p>x</p>');
    Object.defineProperty(window, 'scrollY', { value: 240.4 });

    window.dispatchEvent(new window.Event('scroll'));
    window.dispatchEvent(new window.Event('scroll'));
    window.dispatchEvent(new window.Event('scroll'));
    await wait(150);

    expect(
      sent.filter((m) => (m as { type: string }).type === 'scroll'),
    ).toEqual([{ source: BRIDGE_SOURCE, type: 'scroll', y: 240 }]);
  });

  it('sends a waiting scroll position before following a link', () => {
    const { window, sent } = loadPage('<a id="go" href="a.zz">x</a>');
    Object.defineProperty(window, 'scrollY', { value: 300 });
    sent.length = 0;

    window.dispatchEvent(new window.Event('scroll'));
    click(window, '#go');

    expect(sent).toEqual([
      { source: BRIDGE_SOURCE, type: 'scroll', y: 300 },
      { source: BRIDGE_SOURCE, type: 'navigate', href: 'a.zz' },
    ]);
  });

  it('announces itself once the page has loaded', () => {
    const { window, sent } = loadPage('<p>x</p>');
    window.dispatchEvent(new window.Event('load'));
    expect(sent).toContainEqual({ source: BRIDGE_SOURCE, type: 'ready' });
  });

  describe('restoring scroll', () => {
    const restore = (
      window: JSDOM['window'],
      data: unknown,
      source: unknown = window.parent,
    ) => {
      const scrollTo = vi.fn();
      window.scrollTo = scrollTo;
      window.dispatchEvent(
        new window.MessageEvent('message', {
          data,
          source: source as MessageEventSource,
        }),
      );
      return scrollTo;
    };

    it('scrolls when the host asks', () => {
      const { window } = loadPage('<p>x</p>');
      const scrollTo = restore(window, {
        source: BRIDGE_SOURCE,
        type: 'restore',
        y: 500,
      });
      expect(scrollTo).toHaveBeenCalledWith(0, 500);
    });

    it.each([
      ['another source', { source: 'other', type: 'restore', y: 500 }],
      ['another type', { source: BRIDGE_SOURCE, type: 'other', y: 500 }],
      ['a bad position', { source: BRIDGE_SOURCE, type: 'restore', y: 'x' }],
      [
        'a negative position',
        { source: BRIDGE_SOURCE, type: 'restore', y: -1 },
      ],
      ['nothing', null],
    ])('ignores %s', (_name, data) => {
      const { window } = loadPage('<p>x</p>');
      expect(restore(window, data)).not.toHaveBeenCalled();
    });

    it('ignores a message from anything but the host', () => {
      const { window } = loadPage('<p>x</p>');
      const other = new JSDOM('').window;
      const scrollTo = restore(
        window,
        { source: BRIDGE_SOURCE, type: 'restore', y: 500 },
        other,
      );
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });

  it('only sends messages the shared protocol accepts', async () => {
    const { window, sent } = loadPage('<a id="go" href="a.zz">x</a>');
    click(window, '#go');
    window.dispatchEvent(new window.Event('scroll'));
    await wait(150);

    const types = sent.map((m) => (m as { type: string }).type);
    expect(types).toEqual(
      expect.arrayContaining(['navigate', 'scroll', 'ready']),
    );
    for (const message of sent) {
      expect(frameMessageSchema.safeParse(message).success).toBe(true);
    }
  });
});
