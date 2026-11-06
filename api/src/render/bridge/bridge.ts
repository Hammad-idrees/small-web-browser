import { BRIDGE_SOURCE } from '@small-web/contracts';

/**
 * The only script allowed to run inside a contained page, and the only way out of
 * it. It reports link clicks and scroll position, and restores a scroll position
 * when asked. It runs before any author markup is parsed.
 *
 * Every link click is cancelled and reported, so the frame itself never navigates.
 * In-page links are handled here too, because a real fragment navigation would add
 * an entry to the browser's own history and break Back.
 */
export const BRIDGE_SCRIPT = `(function () {
  var host = window.parent;
  var SOURCE = ${JSON.stringify(BRIDGE_SOURCE)};
  var SCROLL_REPORT_MS = 100;
  var scrollTimer = null;

  function send(message) {
    message.source = SOURCE;
    host.postMessage(message, '*');
  }

  function linkFrom(event) {
    var node = event.target;
    var element = node && node.nodeType === 1 ? node : node && node.parentElement;
    return element ? element.closest('a[href]') : null;
  }

  function scrollToFragment(href) {
    var id = href.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (error) {}
    var target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else if (!id) window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (event) {
    var link = linkFrom(event);
    if (!link) return;
    event.preventDefault();
    var href = link.getAttribute('href') || '';
    if (href.charAt(0) === '#') scrollToFragment(href);
    else send({ type: 'navigate', href: href });
  }, true);

  document.addEventListener('auxclick', function (event) {
    if (linkFrom(event)) event.preventDefault();
  }, true);

  window.addEventListener('scroll', function () {
    if (scrollTimer !== null) return;
    scrollTimer = setTimeout(function () {
      scrollTimer = null;
      send({ type: 'scroll', y: Math.max(0, Math.round(window.scrollY)) });
    }, SCROLL_REPORT_MS);
  }, { passive: true });

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (event.source !== host || !data || data.source !== SOURCE) return;
    if (data.type === 'restore' && typeof data.y === 'number' && data.y >= 0) {
      window.scrollTo(0, data.y);
    }
  });

  window.addEventListener('load', function () {
    send({ type: 'ready' });
  });
})();`;
