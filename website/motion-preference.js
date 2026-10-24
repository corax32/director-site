'use strict';

(() => {
  const root = document.documentElement;
  const control = document.querySelector('#motion-preference');
  const key = 'palantir.motion.v1';
  const valid = value => ['system', 'full', 'reduced'].includes(value);
  const media = typeof matchMedia === 'function'
    ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  let choice = root.dataset.motionPreference;
  if (!valid(choice)) {
    try { choice = localStorage.getItem(key); } catch { /* Optional preference. */ }
  }
  if (!valid(choice)) choice = 'full';

  function apply(next, persist = false, notify = true) {
    choice = valid(next) ? next : 'full';
    const motion = choice === 'system' ? (media.matches ? 'reduced' : 'full') : choice;
    const changed = root.dataset.motion !== motion || root.dataset.motionPreference !== choice;
    root.dataset.motion = motion;
    root.dataset.motionPreference = choice;
    if (control) control.value = choice;
    if (persist) {
      try { localStorage.setItem(key, choice); } catch { /* Still apply for this document. */ }
    }
    if (notify && changed) {
      const detail = {preference:choice, motion};
      let event;
      if (typeof CustomEvent === 'function') event = new CustomEvent('palantir:motionchange', {detail});
      else { event = new Event('palantir:motionchange'); event.detail = detail; }
      window.dispatchEvent(event);
    }
  }

  apply(choice, false, false);
  control?.addEventListener('change', () => apply(control.value, true));
  const systemChanged = () => { if (choice === 'system') apply(choice); };
  if (media.addEventListener) media.addEventListener('change', systemChanged);
  else if (media.addListener) media.addListener(systemChanged);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();
