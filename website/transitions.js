'use strict';

(() => {
  const curtain = document.querySelector('#page-transition');
  if (!curtain) return;
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const ENTER = 300;
  const HOLD = 140;
  const LEAVE = 400;
  let active = null;
  let internalNavigation = false;
  let scrollFrame = null;

  function destination(href) {
    let url, id;
    try {
      url = new URL(href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname
          || url.search !== location.search) return null;
      if (!url.hash && !href.endsWith('#')) return null;
      id = decodeURIComponent(url.hash.slice(1));
    } catch { return null; }
    const target = id ? document.getElementById(id) : root;
    if (!target || target.isConnected === false) return null;
    return { url, target, top: !id };
  }

  function clearScrollFrame() {
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
    root.classList.remove('transition-jump');
  }

  function finish(operation = active) {
    if (!operation || operation !== active) return;
    operation.timers.forEach(clearTimeout);
    active = null;
    curtain.dataset.phase = 'idle';
    clearScrollFrame();
  }

  function focusDestination(target) {
    const focusTarget = target === root
      ? document.querySelector('#hero-title')
      : target.querySelector('h1, h2, h3') || target;
    if (!focusTarget) return;
    const temporary = !focusTarget.hasAttribute('tabindex');
    if (temporary) {
      focusTarget.setAttribute('tabindex', '-1');
      focusTarget.addEventListener('blur', () => {
        if (focusTarget.getAttribute('tabindex') === '-1') focusTarget.removeAttribute('tabindex');
      }, { once: true });
    }
    focusTarget.focus({ preventScroll: true });
  }

  function commit(operation) {
    if (operation !== active || operation.committed) return false;
    // Resolve again: a removed or replaced destination cannot leave a stale jump.
    const next = destination(operation.destination.url.href);
    if (!next) { finish(operation); return false; }
    operation.committed = true;
    internalNavigation = true;
    try {
      let container = next.target;
      while (container && container !== root) {
        if (container.tagName === 'DETAILS') container.open = true;
        container = container.parentElement;
      }
      clearScrollFrame();
      root.classList.add('transition-jump');
      const oldURL = location.href;
      const hash = next.url.hash || '#';
      if (location.hash !== next.url.hash) {
        history.pushState(null, '', hash);
        window.dispatchEvent(new HashChangeEvent('hashchange', {oldURL, newURL: location.href}));
      }
      if (next.top) window.scrollTo({ top: 0, behavior: 'auto' });
      else next.target.scrollIntoView({ block: 'start', behavior: 'auto' });
      focusDestination(next.target);
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        root.classList.remove('transition-jump');
      });
    } catch {
      // Native anchor navigation remains the fallback if history/focus fails.
      finish(operation);
      location.hash = next.url.hash || '#';
      return false;
    } finally {
      internalNavigation = false;
    }
    return true;
  }

  function later(operation, callback, delay) {
    operation.timers.push(setTimeout(() => {
      if (operation === active) callback();
    }, delay));
  }

  function begin(next) {
    if (active && !active.committed) {
      active.destination = next;
      return;
    }
    finish();
    const operation = { destination: next, committed: false, timers: [] };
    active = operation;
    // Restart the finite CSS sequence only for a genuinely new transition.
    curtain.dataset.phase = 'idle';
    void curtain.offsetWidth;
    curtain.dataset.phase = 'entering';
    later(operation, () => {
      curtain.dataset.phase = 'covered';
      if (!commit(operation)) return;
      later(operation, () => {
        curtain.dataset.phase = 'leaving';
        later(operation, () => finish(operation), LEAVE);
      }, HOLD);
    }, ENTER);
    later(operation, () => finish(operation), 1200);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey || document.hidden || preference.matches
        || root.classList.contains('intro-pending')) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download')
        || (link.target && link.target !== '_self')
        || link.matches('.skip-link') || link.closest('.palantir-window, dialog, [role="dialog"]')) return;
    const next = destination(link.getAttribute('href'));
    if (!next) return;
    event.preventDefault();
    begin(next);
  });

  function interrupt() { if (!internalNavigation) finish(); }
  document.addEventListener('keydown', event => {
    if (['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
  });
  document.addEventListener('focusin', interrupt);
  document.addEventListener('wheel', interrupt, { passive: true });
  document.addEventListener('touchstart', interrupt, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); });
  window.addEventListener('pagehide', interrupt);
  window.addEventListener('popstate', interrupt);
  window.addEventListener('hashchange', interrupt);
  const updatePreference = () => {
    if (!preference.matches || !active) return;
    const operation = active;
    commit(operation);
    finish(operation);
  };
  if (preference.addEventListener) preference.addEventListener('change', updatePreference);
  else preference.addListener(updatePreference);
})();
