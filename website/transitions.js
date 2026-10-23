'use strict';

(() => {
  const root = document.documentElement;
  const curtain = document.querySelector('#page-transition');
  const preference = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)') : {matches: true};
  const MARKER = 'palantir.page-transition.v1';
  const ENTER = 300, HOLD = 140, LEAVE = 400, STALL = 10000;
  const slugs = {home:'', features:'capabilities', interface:'console', approach:'approach', guide:'access', questions:'briefing'};
  const page = root.dataset.page || 'home';
  const normalizedPath = pathname => pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
  const currentPath = normalizedPath(location.pathname);
  const currentSlug = slugs[page];
  const base = currentSlug && currentPath.endsWith('/' + currentSlug + '/')
    ? currentPath.slice(0, -currentSlug.length - 1) : currentPath;
  const paths = new Set(Object.values(slugs).map(slug => base + (slug ? slug + '/' : '')));
  let active = null;

  function destination(href) {
    let url;
    try { url = new URL(href, location.href); } catch { return null; }
    if (url.origin !== location.origin || !paths.has(normalizedPath(url.pathname))) return null;
    // A fragment within the current document belongs entirely to the browser.
    if (normalizedPath(url.pathname) === currentPath && url.search === location.search) return null;
    return url;
  }

  function clearMarker() {
    try { sessionStorage.removeItem(MARKER); } catch { /* Storage may be unavailable. */ }
  }

  function announce(animate, initial = false) {
    const detail = {view: page, animate: Boolean(animate && !preference.matches), initial};
    let event;
    if (typeof CustomEvent === 'function') event = new CustomEvent('palantir:viewchange', {detail});
    else { event = new Event('palantir:viewchange'); event.detail = detail; }
    window.dispatchEvent(event);
  }

  function cleanup(operation = active) {
    if (operation && operation !== active) return;
    if (operation && typeof clearTimeout === 'function') operation.timers.forEach(clearTimeout);
    active = null;
    if (curtain) curtain.dataset.phase = 'idle';
    root.classList.remove('page-arriving', 'page-departing');
  }

  function finishArrival(operation, animate) {
    if (operation !== active) return;
    cleanup(operation);
    announce(animate);
  }

  function canAnimate() {
    return curtain && !preference.matches && !document.hidden
      && typeof setTimeout === 'function' && typeof clearTimeout === 'function';
  }

  function assign(operation) {
    if (operation !== active || operation.assigned) return;
    operation.assigned = true;
    // This is only a visual arrival hint. The new document validates and consumes
    // it; neither this script nor the bootstrap ever redirects from stored data.
    try {
      if (preference.matches) clearMarker();
      else sessionStorage.setItem(MARKER, JSON.stringify({url: operation.url.href, at: Date.now()}));
    } catch { clearMarker(); }
    try {
      if (typeof location.assign === 'function') location.assign(operation.url.href);
      else location.href = operation.url.href;
    } catch {
      clearMarker();
      cleanup(operation);
      return;
    }
    // A blocked navigation must not leave this document covered indefinitely.
    if (typeof setTimeout === 'function') {
      try {
        operation.timers.push(setTimeout(() => {
          if (operation !== active) return;
          clearMarker();
          cleanup(operation);
        }, STALL));
      } catch { cleanup(operation); }
    } else cleanup(operation);
  }

  function later(operation, callback, delay) {
    try {
      operation.timers.push(setTimeout(() => { if (operation === active) callback(); }, delay));
      return true;
    } catch {
      if (operation.kind === 'outgoing') assign(operation);
      else finishArrival(operation, false);
      return false;
    }
  }

  function begin(url) {
    if (active?.kind === 'outgoing' && !active.assigned) {
      active.url = url;
      return;
    }
    cleanup();
    const operation = {kind:'outgoing', url, timers:[], assigned:false};
    active = operation;
    if (!canAnimate() || root.classList.contains('intro-pending')) { assign(operation); return; }
    root.classList.add('page-departing');
    curtain.dataset.phase = 'idle';
    void curtain.offsetWidth;
    curtain.dataset.phase = 'entering';
    later(operation, () => {
      curtain.dataset.phase = 'covered';
      later(operation, () => assign(operation), HOLD);
    }, ENTER);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')
        || link.matches('.skip-link') || link.closest('.palantir-window, dialog, [role="dialog"]')) return;
    const url = destination(link.getAttribute('href'));
    if (!url) return;
    event.preventDefault();
    begin(url);
  });

  // Ordinary pointer focus and scrolling do not discard a clicked destination.
  // Keyboard navigation before assign is an explicit cancellation of the delay.
  document.addEventListener('keydown', event => {
    if (!['Escape', 'Tab'].includes(event.key) || active?.kind !== 'outgoing' || active.assigned) return;
    clearMarker();
    cleanup();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !active) return;
    if (active.kind === 'arrival') finishArrival(active, false);
    else assign(active);
  });
  // Keep the marker for the destination. Clear only this document's visual state
  // so a later BFCache restore cannot bring a covering curtain back with it.
  window.addEventListener('pagehide', () => cleanup());
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    cleanup();
    clearMarker();
    announce(false);
  });
  const updatePreference = () => {
    if (!preference.matches || !active) return;
    if (active.kind === 'arrival') finishArrival(active, false);
    else assign(active);
  };
  if (preference.addEventListener) preference.addEventListener('change', updatePreference);
  else if (preference.addListener) preference.addListener(updatePreference);

  if (root.classList.contains('page-arriving')) {
    const operation = {kind:'arrival', timers:[]};
    active = operation;
    if (!canAnimate()) { finishArrival(operation, false); return; }
    curtain.dataset.phase = 'covered';
    later(operation, () => {
      curtain.dataset.phase = 'leaving';
      later(operation, () => finishArrival(operation, true), LEAVE);
    }, HOLD);
  } else announce(false, true);
})();
