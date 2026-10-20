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

  function finishIntro() {
    const hadFocus = intro.contains(document.activeElement);
    clearTimeout(introTimer);
    clearTimeout(introRevealTimer);
    root.classList.remove('intro-pending', 'intro-ready');
    intro.setAttribute('aria-hidden', 'true');
    skip.tabIndex = -1;
    // Skipping must reveal the page immediately, including delayed hero entrances.
    running.forEach(animation => animation.cancel());
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
    introTimer = setTimeout(finishIntro, 3400);
  }

  skip.addEventListener('click', finishIntro);
  document.addEventListener('keydown', event => {
    if (!root.classList.contains('intro-pending')) return;
    if (event.key === 'Escape' || event.key === 'Tab') finishIntro();
  });
  document.querySelector('.skip-link').addEventListener('focus', finishIntro);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishIntro();
    else if (waitingForVisibility) startIntro();
  });
  window.addEventListener('pagehide', finishIntro);
  intro.addEventListener('animationend', event => {
    if (event.target === intro && event.animationName === 'intro-exit') finishIntro();
  });

  function reveal(element, delay = 0) {
    if (preference.matches || document.hidden || !element.animate || element.matches(':focus-within')) return;
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 720, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
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
    const introDelay = root.classList.contains('intro-pending') ? 2700 : 0;
    // Deep links, history restoration and keyboard navigation keep immediate content.
    if (!location.hash && window.scrollY < 40) {
      document.querySelectorAll('.hero-copy > *').forEach((element, index) => reveal(element, introDelay + index * 65));
    }
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const siblings = entry.target.parentElement.children;
        const index = Array.prototype.indexOf.call(siblings, entry.target);
        reveal(entry.target, Math.min(index % 3, 2) * 55);
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
    running.forEach(animation => {
      if (animation.effect?.target?.contains(event.target)) animation.cancel();
    });
  });
  window.addEventListener('hashchange', () => {
    finishIntro();
    running.forEach(animation => animation.cancel());
  });

  if (root.classList.contains('intro-pending')) startIntro();
  setupReveals();
})();
