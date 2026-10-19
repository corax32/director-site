'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});

const copyButton = document.querySelector('#copy-command');
copyButton.addEventListener('click', async () => {
  const command = document.querySelector('#build-command');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(command.textContent);
    status.textContent = 'Build command copied.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(command);
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = 'Copy is unavailable here. The command is selected for you to copy.';
  }
});

function openLinkedDetails() {
  if (window.location.hash === '#build-guide') document.querySelector('#build-guide').open = true;
}
window.addEventListener('hashchange', openLinkedDetails);
document.querySelectorAll('a[href="#build-guide"]').forEach(link => link.addEventListener('click', () => {
  document.querySelector('#build-guide').open = true;
}));
openLinkedDetails();
