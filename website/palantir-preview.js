'use strict';

(() => {
  const tabs = window.PALANTIR_PREVIEW_TABS;
  const windowElement = document.querySelector('.palantir-window');
  if (!windowElement || !Array.isArray(tabs)) return;
  const sidebar = windowElement.querySelector('.dw-sidebar');
  const panels = windowElement.querySelector('.dw-panels');
  const status = windowElement.querySelector('.dw-status');
  const search = windowElement.querySelector('#dw-search');
  const searchResults = windowElement.querySelector('.dw-search-results');
  const controls = tabs.flatMap(tab => tab.columns.flatMap(column => column.flatMap(group =>
    group.controls.filter(control => control.id && 'value' in control))));
  const defaults = Object.fromEntries(controls.map(control => [control.id, control.value]));
  const values = {...defaults};
  const widgets = new Map();
  const searchIndex = [];
  const tabButtons = [];
  const storageKey = 'palantir.browser-preview.v1';
  const legacyStorageKey = 'director.browser-preview.v1';
  let restored = false;
  const themeKeys = ['BackgroundColor', 'MainColor', 'AccentColor', 'OutlineColor', 'FontColor'];
  const themeVariables = ['background', 'main', 'accent', 'outline', 'font'];
  const themes = {
    Palantir: ['#000000', '#0c0c0c', '#d4d4d4', '#252525', '#999999'],
    Volt: ['#1b1b1f', '#131316', '#a78bfa', '#2a2a30', '#e4e4e7']
  };

  function validValue(control, value) {
    if (control.type === 'toggle') return typeof value === 'boolean';
    if (control.type === 'range') return typeof value === 'number' && Number.isFinite(value) && value >= control.min && value <= control.max;
    if (control.type === 'select') return control.options.includes(value);
    if (control.type === 'color') return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
    return typeof value === 'string' && value.length <= 64;
  }
  try {
    // Preserve earlier preview saves, with the Palantir save taking precedence.
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      if (saved.ThemeManager_ThemeList === 'Director') saved.ThemeManager_ThemeList = 'Palantir';
      controls.forEach(control => {
        if (Object.hasOwn(saved, control.id) && validValue(control, saved[control.id])) {
          values[control.id] = saved[control.id];
          restored = true;
        }
      });
    }
  } catch { /* Storage is optional; the preview also works without it. */ }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + name);
    svg.append(use);
    return svg;
  }
  function announce(message) {
    status.textContent = message;
    status.title = message;
  }
  function applyTheme() {
    themeKeys.forEach((key, i) => windowElement.style.setProperty('--dw-' + themeVariables[i], values[key]));
    windowElement.dataset.animations = String(values.UIAnimations);
  }
  function updateWidget(control) {
    const {input, output} = widgets.get(control.id);
    const value = values[control.id];
    if (control.type === 'toggle') input.setAttribute('aria-checked', String(value));
    else input.value = value;
    if (control.type === 'range') {
      const display = Number(Number(value).toFixed(1)) + (control.suffix || '');
      output.value = display;
      input.setAttribute('aria-valuetext', display);
      input.style.setProperty('--dw-fill', ((value - control.min) / (control.max - control.min) * 100) + '%');
    }
  }
  function changed(control, value) {
    values[control.id] = value;
    updateWidget(control);
    if (control.id === 'ThemeManager_ThemeList') {
      themeKeys.forEach((key, i) => { values[key] = themes[value][i]; });
      controls.filter(item => themeKeys.includes(item.id)).forEach(updateWidget);
    }
    applyTheme();
    announce(control.label + ': ' + (typeof value === 'boolean' ? (value ? 'on' : 'off') : value) + ' (preview only).');
  }
  function runAction(control) {
    if (control.action === 'preview_save') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
        announce((values.SaveManager_ConfigName.trim() || 'Your preview') + ' saved in this browser.');
      } catch { announce('Browser storage is unavailable. Settings remain in this open preview.'); }
    } else if (control.action === 'preview_reset') {
      Object.assign(values, defaults);
      controls.forEach(updateWidget);
      applyTheme();
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(legacyStorageKey);
        announce('Preview reset to the menu defaults.');
      } catch { announce('Preview reset. The browser blocked removal of the saved settings.'); }
    } else {
      announce(control.label + ' is available in Palantir in-game. This is a menu preview.');
    }
  }
  function renderControl(control, tab, group) {
    if (control.type === 'note') return element('p', 'dw-note', control.text);
    const row = element('div', 'dw-control');
    row.dataset.control = control.id;
    const id = 'dw-control-' + control.id;
    let input;
    let output;
    if (control.type === 'toggle') {
      input = element('button', 'dw-toggle');
      input.type = 'button';
      input.setAttribute('role', 'switch');
      input.append(element('span', '', control.label), element('span', 'dw-switch-track'));
      input.lastChild.setAttribute('aria-hidden', 'true');
      input.addEventListener('click', () => changed(control, !values[control.id]));
      row.append(input);
    } else if (control.type === 'button') {
      input = element('button', 'dw-button', control.label);
      input.type = 'button';
      input.addEventListener('click', () => runAction(control));
      row.append(input);
    } else {
      const label = element('label', 'dw-field-label', control.label);
      label.htmlFor = id;
      row.append(label);
      if (control.type === 'select') {
        input = element('select', 'dw-select');
        control.options.forEach(option => {
          const node = element('option', '', option);
          node.value = option;
          input.append(node);
        });
        input.addEventListener('change', () => changed(control, input.value));
        row.append(input);
      } else if (control.type === 'range') {
        const shell = element('div', 'dw-slider-shell');
        input = element('input');
        input.type = 'range';
        input.min = control.min;
        input.max = control.max;
        input.step = control.step;
        output = element('output', 'dw-slider-value');
        output.htmlFor = id;
        output.setAttribute('aria-hidden', 'true');
        input.addEventListener('input', () => { values[control.id] = Number(input.value); updateWidget(control); });
        input.addEventListener('change', () => changed(control, Number(input.value)));
        shell.append(input, output);
        row.append(shell);
      } else {
        input = element('input', control.type === 'color' ? 'dw-color' : 'dw-text');
        input.type = control.type === 'color' ? 'color' : 'text';
        if (control.type === 'color') {
          row.classList.add('dw-color-row');
          label.className = '';
        } else {
          input.maxLength = 64;
          input.placeholder = 'My Palantir';
          input.autocomplete = 'off';
        }
        input.addEventListener('input', () => { values[control.id] = input.value; applyTheme(); });
        input.addEventListener('change', () => changed(control, input.value));
        row.append(input);
      }
    }
    input.id = id;
    if ('value' in control) widgets.set(control.id, {input, output});
    searchIndex.push({control, tab, group, row, input});
    return row;
  }
  function activateTab(id, focus = false) {
    tabButtons.forEach(button => {
      const selected = button.dataset.tab === id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      document.getElementById(button.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) button.focus();
    });
  }

  tabs.forEach((tab, index) => {
    const button = element('button', 'dw-tab');
    button.type = 'button';
    button.id = 'dw-tab-' + tab.id;
    button.dataset.tab = tab.id;
    button.title = tab.label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'dw-panel-' + tab.id);
    button.append(icon(tab.id === 'combat' ? 'icon-combat' : tab.icon), element('span', '', tab.label));
    button.addEventListener('click', () => activateTab(tab.id));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activateTab(tabs[next].id, true); }
    });
    tabButtons.push(button);
    sidebar.append(button);
    const panel = element('section', 'dw-panel');
    panel.id = 'dw-panel-' + tab.id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    tab.columns.forEach(groups => {
      const column = element('div', 'dw-column');
      groups.forEach(group => {
        const section = element('section', 'dw-group');
        section.append(element('h3', '', group.title));
        group.controls.forEach(control => section.append(renderControl(control, tab, group)));
        column.append(section);
      });
      panel.append(column);
    });
    panels.append(panel);
  });
  controls.forEach(updateWidget);
  applyTheme();
  activateTab('main');
  announce(restored ? 'Saved browser settings restored.' : 'Explore the menu. Changes affect this preview only.');

  function hideSearch() { searchResults.hidden = true; search.setAttribute('aria-expanded', 'false'); }
  function showSearch() {
    const query = search.value.trim().toLowerCase();
    searchResults.replaceChildren();
    if (!query) { hideSearch(); return; }
    const matches = searchIndex.filter(item => (item.control.label + ' ' + item.group.title + ' ' + item.tab.label).toLowerCase().includes(query)).slice(0, 8);
    matches.forEach(item => {
      const result = element('button', 'dw-result', item.control.label);
      result.type = 'button';
      result.append(element('small', '', item.tab.label + ' / ' + item.group.title));
      result.addEventListener('click', () => {
        activateTab(item.tab.id);
        hideSearch();
        search.value = '';
        item.input.focus({preventScroll: true});
        item.row.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
        item.row.classList.remove('dw-flash');
        void item.row.offsetWidth;
        item.row.classList.add('dw-flash');
        announce('Found ' + item.control.label + ' in ' + item.tab.label + '.');
      });
      result.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); (result.nextElementSibling || searchResults.firstElementChild).focus(); }
        if (event.key === 'ArrowUp') { event.preventDefault(); (result.previousElementSibling || search).focus(); }
      });
      searchResults.append(result);
    });
    if (!matches.length) searchResults.append(element('p', 'dw-no-results', 'No matching settings in this preview.'));
    searchResults.hidden = false;
    search.setAttribute('aria-expanded', 'true');
  }
  search.addEventListener('input', showSearch);
  search.addEventListener('focus', showSearch);
  search.addEventListener('keydown', event => {
    const first = searchResults.querySelector('button');
    if ((event.key === 'ArrowDown' || event.key === 'Enter') && !searchResults.hidden && first) {
      event.preventDefault();
      if (event.key === 'Enter') first.click(); else first.focus();
    }
  });
  windowElement.querySelector('.dw-search').addEventListener('keydown', event => {
    if (event.key === 'Escape' && !searchResults.hidden) {
      event.preventDefault();
      event.stopPropagation();
      search.focus();
      hideSearch();
    }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.dw-search')) hideSearch(); });
  windowElement.querySelector('.dw-search').addEventListener('focusout', event => {
    if (!event.currentTarget.contains(event.relatedTarget)) hideSearch();
  });

  const dialog = document.querySelector('.dw-dialog');
  const home = document.querySelector('#dw-window-home');
  const expand = document.querySelector('.dw-expand');
  const close = dialog.querySelector('.dw-close');
  expand.addEventListener('click', () => {
    hideSearch();
    home.style.height = windowElement.offsetHeight + 'px';
    dialog.append(windowElement);
    dialog.showModal();
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
  dialog.addEventListener('close', () => {
    home.append(windowElement);
    home.style.height = '';
    expand.focus({preventScroll: true});
  });
})();
