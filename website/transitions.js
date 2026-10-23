'use strict';

(() => {
  const root = document.documentElement;
  const panels = [...document.querySelectorAll('[data-site-view]')];
  // Without view markup, real fragment links retain native navigation.
  if (!panels.length) return;
  const views = new Map();
  panels.forEach(panel => {
    const name = panel.dataset.siteView;
    if (!views.has(name)) views.set(name, []);
    views.get(name).push(panel);
  });
  const curtain = document.querySelector('#page-transition');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const ENTER = 300, HOLD = 140, LEAVE = 400;
  let active = null;
  let currentView = null;
  let appliedURL = null;
  let internalNavigation = false;

  function destination(href) {
    let url, id;
    try {
      url = new URL(href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname
          || url.search !== location.search) return null;
      id = decodeURIComponent(url.hash.slice(1));
    } catch { return null; }
    const target = id ? document.getElementById(id) : null;
    const view = !id || id === 'main' || id === 'home' ? 'home'
      : target?.closest('[data-site-view]')?.dataset.siteView
        || (views.has(id) ? id : null);
    if (!views.has(view) || !views.get(view).some(panel => panel.isConnected !== false)) return null;
    return {url, view, target: target || views.get(view)[0], internal: id === 'build-guide'};
  }

  function announce(next, animate, initial = false) {
    const detail = {view: next.view, animate: Boolean(animate && !preference.matches), initial};
    let event;
    if (typeof CustomEvent === 'function') event = new CustomEvent('palantir:viewchange', {detail});
    else { event = new Event('palantir:viewchange'); event.detail = detail; }
    window.dispatchEvent(event);
  }

  function finish(operation = active, notify = false, animate = false) {
    if (!operation || operation !== active) return;
    if (typeof clearTimeout === 'function') operation.timers.forEach(clearTimeout);
    active = null;
    if (curtain) curtain.dataset.phase = 'idle';
    if (notify && operation.committed && operation.destination.view === currentView) {
      announce(operation.destination, animate);
    }
  }

  function focusDestination(next) {
    const panel = views.get(next.view)[0];
    const target = next.internal ? next.target.querySelector('summary') || next.target
      : panel.querySelector('h1, h2, h3') || panel;
    if (!target) return;
    const temporary = !target.hasAttribute('tabindex');
    if (temporary) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => {
        if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex');
      }, {once: true});
    }
    target.focus({preventScroll: true});
  }

  function show(next, {historyMode = 'none', focus = false, initial = false} = {}) {
    // A modal owns the same console node as the inline preview. Close it before
    // hiding its home; the preview's close handler restores that node in place.
    const dialog = document.querySelector('.dw-dialog');
    if (next.view !== 'interface' && dialog?.open) dialog.close();
    for (const panel of panels) {
      const visible = panel.dataset.siteView === next.view;
      panel.hidden = !visible;
      panel.inert = !visible;
    }
    currentView = next.view;
    root.dataset.view = next.view;
    root.classList.add('site-views-ready');
    for (const link of document.querySelectorAll('a[href]')) {
      if (link.closest('.palantir-window, dialog, [role="dialog"]')) continue;
      const route = destination(link.getAttribute('href'));
      if (route?.view === next.view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    if (next.internal) next.target.open = true;
    if (historyMode === 'push' && location.href !== next.url.href) {
      const oldURL = location.href;
      try {
        history.pushState(null, '', next.url.hash || '#');
        internalNavigation = true;
        window.dispatchEvent(new HashChangeEvent('hashchange', {oldURL, newURL: location.href}));
      } catch {
        // The target view is already visible if History is unavailable.
        location.hash = next.url.hash || '#';
      } finally { internalNavigation = false; }
    }
    appliedURL = location.href;
    // Initial home navigation lets the browser preserve reload/BFCache position.
    if (!initial || next.url.hash) {
      root.classList.add('transition-jump');
      try {
        if (next.internal) next.target.scrollIntoView({block: 'start', behavior: 'instant'});
        else window.scrollTo({top: 0, behavior: 'instant'});
      } finally { root.classList.remove('transition-jump'); }
    }
    if (focus) focusDestination(next);
  }

  function commit(operation, focus = true) {
    if (operation !== active || operation.committed) return false;
    const next = destination(operation.destination.url.href);
    if (!next) { finish(operation); return false; }
    operation.destination = next;
    show(next, {historyMode: 'push', focus});
    operation.committed = true;
    return true;
  }

  function settle(operation = active, focus = true) {
    if (!operation || operation !== active) return;
    if (!operation.committed) commit(operation, focus);
    finish(operation, true, false);
  }

  function later(operation, callback, delay) {
    try {
      operation.timers.push(setTimeout(() => {
        if (operation === active) callback();
      }, delay));
      return true;
    } catch { settle(operation); return false; }
  }

  function begin(next) {
    const immediate = !curtain || preference.matches || document.hidden
      || root.classList.contains('intro-pending') || typeof setTimeout !== 'function'
      || typeof clearTimeout !== 'function';
    if (active && !active.committed) {
      active.destination = next;
      if (immediate) settle(active);
      return;
    }
    finish();
    const operation = {destination: next, committed: false, timers: []};
    active = operation;
    if (immediate || next.view === currentView) { settle(operation); return; }
    curtain.dataset.phase = 'idle';
    void curtain.offsetWidth;
    curtain.dataset.phase = 'entering';
    if (!later(operation, () => {
      curtain.dataset.phase = 'covered';
      if (!commit(operation)) return;
      later(operation, () => {
        curtain.dataset.phase = 'leaving';
        later(operation, () => finish(operation, true, true), LEAVE);
      }, HOLD);
    }, ENTER)) return;
    // A suspended/failed sequence must still resolve its accepted destination.
    later(operation, () => settle(operation), 1200);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')
        || link.matches('.skip-link') || link.closest('.palantir-window, dialog, [role="dialog"]')) return;
    const next = destination(link.getAttribute('href'));
    if (!next) return;
    event.preventDefault();
    begin(next);
  });

  function restore() {
    if (internalNavigation) return;
    finish();
    if (appliedURL === location.href) return;
    const next = destination(location.href) || destination('#main');
    show(next);
    announce(next, false);
  }
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', restore);
  window.addEventListener('pagehide', () => finish());
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(active, false); });
  // Normal pointer focus and scrolling must not cancel an accepted tab click.
  // Keyboard dismissal completes it now so no delayed navigation steals focus.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Tab') settle();
  });
  const updatePreference = () => { if (preference.matches) settle(); };
  if (preference.addEventListener) preference.addEventListener('change', updatePreference);
  else preference.addListener(updatePreference);

  const initial = destination(location.href) || destination('#main');
  show(initial, {initial: true});
  announce(initial, false, true);
})();
