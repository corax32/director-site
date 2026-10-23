'use strict';

(() => {
  const root = document.documentElement;
  const intro = document.querySelector('#site-intro');
  const skip = intro.querySelector('.intro-skip');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  let introTimer;
  let introRevealTimer;
  let observer;
  let waitingForVisibility = false;
  let pointerFocus = false;

  function finishIntro(natural = false) {
    const hadFocus = intro.contains(document.activeElement);
    clearTimeout(introTimer);
    clearTimeout(introRevealTimer);
    root.classList.remove('intro-pending', 'intro-ready');
    intro.setAttribute('aria-hidden', 'true');
    skip.tabIndex = -1;
    // Skipping must reveal the page immediately; natural completion keeps the
    // page entrance intact instead of interrupting its last staggered items.
    if (!natural) running.forEach(animation => animation.cancel());
    if (hadFocus) document.querySelector('.site-header .brand').focus({ preventScroll: true });
  }

  function startIntro() {
    if (document.hidden) {
      waitingForVisibility = true;
      root.classList.remove('intro-pending');
      return;
    }
    waitingForVisibility = false;
    clearTimeout(introTimer);
    clearTimeout(introRevealTimer);
    root.classList.remove('intro-pending', 'intro-ready');
    void intro.offsetWidth;
    root.classList.add('intro-pending');
    intro.setAttribute('aria-hidden', 'false');
    skip.tabIndex = 0;
    // A visible hold also works when the browser throttles CSS animation timelines.
    introRevealTimer = setTimeout(() => root.classList.add('intro-ready'), 1800);
    introTimer = setTimeout(() => finishIntro(true), 3400);
  }

  skip.addEventListener('click', () => finishIntro());
  document.addEventListener('pointerdown', () => { pointerFocus = true; }, {passive: true});
  document.addEventListener('keydown', event => {
    pointerFocus = false;
    if (!root.classList.contains('intro-pending')) return;
    if (event.key === 'Escape' || event.key === 'Tab') finishIntro();
  });
  document.querySelector('.skip-link').addEventListener('focus', () => finishIntro());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishIntro();
    else if (waitingForVisibility) startIntro();
  });
  window.addEventListener('pagehide', () => finishIntro());
  intro.addEventListener('animationend', event => {
    if (event.target === intro && event.animationName === 'intro-exit') finishIntro(true);
  });

  function reveal(element, delay = 0) {
    if (preference.matches || document.hidden || !element.animate || element.matches(':focus-within')) return;
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(40px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 400, delay, easing: 'ease', fill: 'backwards' });
    running.add(animation);
    const forget = () => running.delete(animation);
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
  }

  function cancelReveals() {
    observer?.disconnect();
    running.forEach(animation => animation.cancel());
    running.clear();
    root.classList.remove('motion-enabled');
  }

  function setupReveals() {
    if (preference.matches) return;
    root.classList.add('motion-enabled');
    const introDelay = root.classList.contains('intro-pending') ? 3300 : 0;
    // Deep links, history restoration and keyboard navigation keep immediate content.
    if (!location.hash && window.scrollY < 40) {
      document.querySelectorAll('.hero-copy > *').forEach((element, index) => reveal(element, introDelay + index * 100));
    }
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const siblings = entry.target.parentElement.children;
        const index = Array.prototype.indexOf.call(siblings, entry.target);
        const introDelay = root.classList.contains('intro-pending') ? 3300 : 0;
        reveal(entry.target, introDelay + Math.min(index % 3, 2) * 100);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -16px 0px' });
    document.querySelectorAll('.preview-stage, .section-heading, .feature, .approach-visual, .approach-copy, .guide-step, .build-guide, .faq > div, .closing').forEach(element => observer.observe(element));
  }

  const updatePreference = () => {
    cancelReveals();
    if (!preference.matches) setupReveals();
  };
  if (preference.addEventListener) preference.addEventListener('change', updatePreference);
  else preference.addListener(updatePreference);
  document.addEventListener('focusin', event => {
    // Cancelling a transform between pointerdown and click moves the target
    // away from the pointer. Keyboard focus still reveals its target at once.
    if (pointerFocus) return;
    running.forEach(animation => {
      if (animation.effect?.target?.contains(event.target)) animation.cancel();
    });
  });
  window.addEventListener('hashchange', () => {
    finishIntro();
    running.forEach(animation => animation.cancel());
  });

  // Route entrances run after the navigation curtain clears. Revisit animations
  // do not depend on an IntersectionObserver that has already seen the content.
  window.addEventListener('palantir:viewchange', event => {
    if (event.detail?.initial) return;
    running.forEach(animation => animation.cancel());
    running.clear();
    if (!event.detail?.animate || preference.matches || document.hidden) return;
    const selector = '.hero-copy > *, .introduction > *, .section-heading, .feature, .preview-stage, .approach-visual, .approach-copy, .guide-step, .build-guide, .faq > div, .closing';
    const incoming = [];
    document.querySelectorAll('[data-site-view]').forEach(panel => {
      if (panel.hidden || panel.getAttribute('data-site-view') !== event.detail.view) return;
      if (panel.matches(selector)) incoming.push(panel);
      panel.querySelectorAll(selector).forEach(element => incoming.push(element));
    });
    incoming.forEach((element, index) => {
      const rect = element.getBoundingClientRect?.();
      if (rect && rect.top > window.innerHeight) return;
      observer?.unobserve(element);
      reveal(element, Math.min(index, 3) * 70);
    });
  });

  if (root.classList.contains('intro-pending')) startIntro();
  setupReveals();
})();
